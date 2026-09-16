import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Which commit this deployment was built from.
 *
 * Answers "is the live site actually running the code I pushed?" — the first
 * thing to rule out when a fix appears not to have worked. Compare against
 * `git rev-parse --short origin/main`. `unknown` means the build ran without a
 * `.git` directory, so only BUILD_TIME dates it.
 *
 * Included on every response, including the failures: that is exactly when you
 * need it.
 */
function buildInfo() {
  return { sha: process.env.BUILD_SHA || 'unknown', time: process.env.BUILD_TIME || null };
}

/**
 * GET /api/health
 *
 * A deployment smoke test. Answers the question "why is the site throwing a
 * server-side exception?" without needing the host's log viewer — which matters
 * because the most common cause is a database the app cannot reach, and that
 * also means you cannot log in to see anything else.
 *
 * Deliberately safe to expose publicly: it reports a *category* of failure and
 * the fix, never the connection string, credentials, stack trace or raw error
 * text. An attacker learns nothing they could not learn by loading the homepage.
 */

type Diagnosis = {
  problem: string;
  hint: string;
};

/** Map a raw Prisma error onto a safe, actionable category. */
function diagnose(err: unknown): Diagnosis {
  const raw = err instanceof Error ? err.message : String(err);

  // Malformed connection string. Verified against Prisma's own parser: this
  // exact message ("invalid domain character") is raised when the *host*
  // portion contains an illegal character — in practice a space or newline
  // introduced by a wrapped paste, or a stray quote. A leftover
  // [YOUR-PASSWORD] placeholder and an unencoded '@' in the password produce
  // *different* errors, so they are called out separately below.
  if (
    /invalid domain character/i.test(raw) ||
    /Error parsing connection string/i.test(raw) ||
    /provided database string is invalid/i.test(raw)
  ) {
    return {
      problem: 'database-url-malformed',
      hint:
        'DATABASE_URL is set but cannot be parsed. Prisma reports "invalid domain character" ' +
        'when the host part of the URL is malformed, which in practice means a space, a line ' +
        'break, or a quote character has crept into the value — usually from pasting a wrapped ' +
        'connection string into a hosting dashboard. Re-paste it as one unbroken line, with no ' +
        'surrounding quotes. If the password contains "@", "#", "/" or ":", percent-encode it. ' +
        'Run `node scripts/check-db-url.js "<your-url>"` locally to see the exact problem.',
    };
  }

  // Prisma validation: the URL scheme does not match the datasource provider.
  // Almost always a Postgres URL while schema.prisma still says `provider = "sqlite"`.
  if (/must start with the protocol/i.test(raw) || /Error validating datasource/i.test(raw)) {
    return {
      problem: 'database-provider-mismatch',
      hint:
        'DATABASE_URL does not match the datasource provider in prisma/schema.prisma. ' +
        'Run `node scripts/use-db.js postgres` (or mysql) to match your database, then redeploy. ' +
        'Note that `provider` cannot be set from an environment variable.',
    };
  }

  if (/Unable to open the database file|SQLITE_CANTOPEN|code 14/i.test(raw)) {
    return {
      problem: 'database-file-missing',
      hint:
        'SQLite cannot open the database file. Serverless hosts (Vercel, Netlify) have a ' +
        'read-only, ephemeral filesystem, so SQLite cannot work there — use a hosted ' +
        'PostgreSQL database instead. On a VPS, check the path in DATABASE_URL and that the ' +
        'directory is writable.',
    };
  }

  if (/Can't reach database server|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|getaddrinfo/i.test(raw)) {
    return {
      problem: 'database-unreachable',
      hint:
        'The database host could not be reached. Check the host, port and credentials in ' +
        'DATABASE_URL, and that the database allows connections from your deployment.',
    };
  }

  if (/authentication failed|password authentication/i.test(raw)) {
    return {
      problem: 'database-auth-failed',
      hint: 'The database rejected the credentials in DATABASE_URL. Check the username and password.',
    };
  }

  if (/does not exist in the current database|no such table|relation .* does not exist/i.test(raw)) {
    return {
      problem: 'schema-not-pushed',
      hint:
        'Connected to the database, but the tables are missing. Run `npx prisma db push` ' +
        '(or `npm run db:deploy`) against this database, then optionally `npm run db:seed`.',
    };
  }

  if (/Environment variable not found|DATABASE_URL/i.test(raw) && /not found/i.test(raw)) {
    return {
      problem: 'database-url-missing',
      hint: 'DATABASE_URL is not set in this environment. Add it to your host\'s environment variables.',
    };
  }

  return {
    problem: 'database-error',
    hint:
      'The database query failed. Check your host\'s function logs for the underlying error — ' +
      'the app logs it on every failed request.',
  };
}

/**
 * Columns that must be TEXT on MySQL, and the symptom when they are not.
 *
 * Prisma maps a plain `String` to VARCHAR(191) on MySQL, and SQLite does not
 * enforce that limit — so over-long values worked in development and were
 * silently truncated in production. When the value is JSON the truncation makes
 * it unparseable and the interface renders empty, which is how the menu, the
 * payment logos and the product images all appeared broken at once.
 *
 * This is a deliberate subset: the columns whose truncation produces a visible,
 * reported failure. `prisma/fix-column-lengths.sql` widens 80 in total.
 */
const CRITICAL_TEXT_COLUMNS: { table: string; column: string; symptom: string }[] = [
  { table: 'Menu', column: 'items', symptom: 'a saved menu renders empty' },
  { table: 'Setting', column: 'value', symptom: 'long settings such as the payment logos render empty' },
  { table: 'Product', column: 'images', symptom: 'product images do not appear' },
  { table: 'Product', column: 'variants', symptom: 'product variants are lost' },
  { table: 'Product', column: 'attributes', symptom: 'product attributes are lost' },
  { table: 'Product', column: 'description', symptom: 'descriptions are cut off' },
  { table: 'Post', column: 'content', symptom: 'blog posts are cut off' },
  { table: 'Page', column: 'content', symptom: 'pages are cut off' },
];

/**
 * Report which critical columns are still narrow.
 *
 * Only meaningful on MySQL: SQLite has no information_schema and does not enforce
 * length limits at all, so `checked: false` there is expected rather than a
 * failure. Never throws — a health endpoint that can break is not a health
 * endpoint.
 */
async function checkColumnTypes(): Promise<{ checked: boolean; needsMigration: string[] }> {
  if (!/^mysql/i.test(process.env.DATABASE_URL || '')) return { checked: false, needsMigration: [] };

  try {
    const rows = await prisma.$queryRaw<{ TABLE_NAME: string; COLUMN_NAME: string; DATA_TYPE: string }[]>`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
    `;
    const actual = new Map(
      rows.map((r) => [`${r.TABLE_NAME}.${r.COLUMN_NAME}`, String(r.DATA_TYPE).toLowerCase()])
    );

    const needsMigration = CRITICAL_TEXT_COLUMNS.filter((c) => {
      const type = actual.get(`${c.table}.${c.column}`);
      // Only flag a column we actually found and that is still a bounded string.
      // A missing row means the table is absent, which the connection check
      // already reports.
      return type !== undefined && (type === 'varchar' || type === 'char');
    }).map((c) => `${c.table}.${c.column} — ${c.symptom}`);

    return { checked: true, needsMigration };
  } catch {
    return { checked: false, needsMigration: [] };
  }
}

export async function GET() {
  const startedAt = Date.now();

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        problem: 'database-url-missing',
        hint: 'DATABASE_URL is not set in this environment. Add it to your host\'s environment variables.',
        build: buildInfo(),
      },
      { status: 503 }
    );
  }

  try {
    // Cheapest possible round trip that still proves the schema is present.
    const settings = await prisma.setting.count();
    const columns = await checkColumnTypes();

    return NextResponse.json({
      ok: true,
      database: 'connected',
      settings: settings,
      authSecretConfigured: !!process.env.AUTH_SECRET,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
      latencyMs: Date.now() - startedAt,
      build: buildInfo(),
      /**
       * Whether the VARCHAR(191) migration has been applied.
       *
       * `checked: false` on SQLite, where the limit does not exist. On MySQL,
       * anything in `needsMigration` is silently truncating data right now —
       * run prisma/fix-column-lengths.sql and re-save the affected records.
       */
      schema: {
        checked: columns.checked,
        needsMigration: columns.needsMigration,
        hint: columns.needsMigration.length
          ? 'These columns are still VARCHAR(191) and are truncating data. Run prisma/fix-column-lengths.sql in phpMyAdmin, then re-save the affected records.'
          : undefined,
      },
    });
  } catch (err) {
    console.error('[health] database check failed:', err);

    const { problem, hint } = diagnose(err);
    return NextResponse.json({ ok: false, problem, hint, build: buildInfo() }, { status: 503 });
  }
}
