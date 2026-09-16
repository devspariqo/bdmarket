import path from 'path';

/**
 * Where uploaded media is written and read.
 *
 * Defaults to `public/uploads` inside the project, which is correct for local
 * development and for a host that keeps the application directory between
 * deploys.
 *
 * It is **not** correct for Hostinger Web Apps. Builds land in
 * `~/domains/{domain}/hbuilds/current/`, a symlink the deploy swaps for a fresh
 * directory, so anything written under the app root is destroyed by the next
 * push: uploaded logos, product photos and brand marks silently disappear and
 * every page shows a broken image, while the database still holds the paths.
 *
 * Point `UPLOAD_DIR` at a directory outside the build — for example
 * `/home/u123456789/uploads` — and both the upload route and the serving route
 * follow it. No database change is needed: URLs stay `/uploads/<file>`, only the
 * directory they resolve to moves.
 */
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(process.cwd(), 'public', 'uploads');

/** Public URL prefix for an uploaded file. Kept in one place so the two routes
 *  and any future caller cannot disagree. */
export const UPLOAD_URL_PREFIX = '/uploads/';
