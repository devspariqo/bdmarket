import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

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

export async function GET() {
  const startedAt = Date.now();

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        problem: 'database-url-missing',
        hint: 'DATABASE_URL is not set in this environment. Add it to your host\'s environment variables.',
      },
      { status: 503 }
    );
  }

  try {
    // Cheapest possible round trip that still proves the schema is present.
    const settings = await prisma.setting.count();

    return NextResponse.json({
      ok: true,
      database: 'connected',
      settings: settings,
      authSecretConfigured: !!process.env.AUTH_SECRET,
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
      latencyMs: Date.now() - startedAt,
    });
  } catch (err) {
    console.error('[health] database check failed:', err);

    const { problem, hint } = diagnose(err);
    return NextResponse.json({ ok: false, problem, hint }, { status: 503 });
  }
}
