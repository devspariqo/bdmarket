import { PrismaClient } from '@prisma/client';

/**
 * Normalise DATABASE_URL before Prisma reads it.
 *
 * Hosting dashboards are the usual culprit: pasting a connection string into a
 * web form routinely carries over surrounding quotes, a trailing newline, or
 * stray whitespace. Prisma then fails with
 *   "invalid domain character in database URL"
 * which points at the hostname and sends you looking in the wrong place.
 *
 * Only unambiguous cleanups are applied — trimming whitespace and stripping a
 * matching pair of surrounding quotes. Neither can change which database you
 * connect to. Genuinely ambiguous problems (an unencoded `@` in the password,
 * for instance, where it is impossible to tell which `@` is the separator) are
 * deliberately left alone so they fail loudly rather than connecting somewhere
 * unexpected. Use `node scripts/check-db-url.js` to diagnose those.
 */
function normaliseDatabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw;

  let url = raw.trim();

  // Strip one matching pair of surrounding quotes.
  const quoted =
    (url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"));
  if (quoted && url.length > 1) url = url.slice(1, -1).trim();

  if (url !== raw) {
    console.warn(
      '[db] DATABASE_URL contained surrounding whitespace or quotes — normalised. ' +
        'Check the value in your hosting dashboard.'
    );
  }

  return url;
}

const databaseUrl = withPoolDefaults(normaliseDatabaseUrl(process.env.DATABASE_URL));
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

/**
 * Pool settings for shared hosting.
 *
 * Prisma's default pool size is `cpus * 2 + 1`, and shared MySQL plans cap
 * concurrent connections per user (`max_user_connections`, often 10–25 on
 * Hostinger). Exceed it and the server refuses the connection; leave a pooled
 * connection idle past `wait_timeout` and the server closes it, which surfaces
 * as
 *   Invalid `prisma.user.update()` invocation: Server has closed the connection.
 * A perfectly valid query fails because the connection it was handed was already
 * dead.
 *
 * Applied only when the merchant has not set them, so a DATABASE_URL that
 * already tunes the pool keeps its own values. `connection_limit` is deliberately
 * modest: one Node process does not need many, and a low number cannot trip the
 * host's cap.
 */
function withPoolDefaults(url: string | undefined): string | undefined {
  if (!url) return url;
  // Only meaningful for the network protocols; a SQLite file URL has no pool.
  if (!/^(mysql|postgres|postgresql):/i.test(url)) return url;

  try {
    const u = new URL(url);
    if (!u.searchParams.has('connection_limit')) u.searchParams.set('connection_limit', '5');
    if (!u.searchParams.has('pool_timeout')) u.searchParams.set('pool_timeout', '20');
    if (!u.searchParams.has('connect_timeout')) u.searchParams.set('connect_timeout', '15');
    return u.toString();
  } catch {
    // A connection string Prisma can parse but URL cannot (an unencoded `@` in
    // the password, say). Leave it exactly as it is rather than risk mangling it.
    return url;
  }
}

/**
 * Errors worth retrying once.
 *
 * Every one of these means the *connection* died, not that the query was wrong.
 * A retry takes a fresh connection from the pool and normally succeeds, which
 * turns a confusing 500 into a slightly slower request.
 */
const RETRYABLE =
  /server has closed the connection|connection closed|connection reset|econnreset|epipe|etimedout|too many connections|can't reach database server|cannot reach database server|connection pool timed out|terminating connection|gone away/i;

function isRetryable(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err ?? '');
  return RETRYABLE.test(message);
}

const globalForPrisma = globalThis as unknown as { prisma?: ReturnType<typeof createClient> };

/**
 * Build the client, wrapping every query with a single retry on a dead
 * connection.
 *
 * Done as a client extension rather than per-call-site so it covers all ~200
 * queries in the app, including any added later. Retrying is safe here because
 * these failures happen before the statement runs, so there is nothing to
 * double-apply — a retried write that had already succeeded would not surface as
 * one of these errors.
 */
function createClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  return base.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          try {
            return await query(args);
          } catch (err) {
            if (!isRetryable(err)) throw err;
            console.warn('[db] connection lost, retrying once:', (err as Error).message);
            // A brief pause so the pool has a chance to discard the dead socket.
            await new Promise((r) => setTimeout(r, 150));
            return query(args);
          }
        },
      },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
