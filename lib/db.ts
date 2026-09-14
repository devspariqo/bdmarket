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

const databaseUrl = normaliseDatabaseUrl(process.env.DATABASE_URL);
if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
