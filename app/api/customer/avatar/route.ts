import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from '@/lib/uploads';

export const dynamic = 'force-dynamic';

/**
 * POST /api/customer/avatar — upload the signed-in customer's profile photo.
 * DELETE /api/customer/avatar — remove it.
 *
 * Unlike the admin media route, this is reachable by anyone who can register, so
 * it is deliberately strict:
 *
 * 1. **A session is required, and the avatar is written to that customer's own
 *    row.** The id comes from the session, never from the request body — taking
 *    it from the body would let any signed-in customer overwrite anyone else's
 *    photo by changing one field.
 *
 * 2. **The file type is checked from its magic bytes, not from `file.type`.**
 *    The browser's declared MIME type is attacker-controlled, so trusting it
 *    means trusting whatever the uploader chose to write there.
 *
 * 3. **SVG is refused.** It is an image to a browser and a script host to
 *    everything else, and these files are served from the store's own origin —
 *    an uploaded SVG is stored XSS against every visitor who opens the URL.
 *    The admin uploader allows SVG because only the merchant can reach it.
 *
 * 4. **2 MB.** A profile photo renders at 40–96px. The client downscales before
 *    sending; this is the backstop for a direct POST.
 */

const MAX_BYTES = 2 * 1024 * 1024;

/** Extension and MIME for each accepted format. */
const FORMATS: { ext: string; mime: string; test: (b: Buffer) => boolean }[] = [
  {
    ext: 'jpg',
    mime: 'image/jpeg',
    test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: 'png',
    mime: 'image/png',
    test: (b) =>
      b.length > 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    ext: 'webp',
    mime: 'image/webp',
    // "RIFF" .... "WEBP"
    test: (b) =>
      b.length > 12 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP',
  },
];

export async function POST(req: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'That image is larger than 2 MB' }, { status: 413 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const format = FORMATS.find((f) => f.test(bytes));
  if (!format) {
    return NextResponse.json(
      { error: 'Please upload a JPG, PNG or WebP image' },
      { status: 415 }
    );
  }

  try {
    const { writeFile, mkdir } = await import('fs/promises');
    const path = await import('path');

    // A subdirectory keeps avatars separable from product media, and the filename
    // is built only from the customer id and a timestamp — never from the
    // uploaded name, which could contain path separators or a second extension.
    const dir = path.join(UPLOAD_DIR, 'avatars');
    await mkdir(dir, { recursive: true });

    const filename = `${session.id}-${Date.now()}.${format.ext}`;
    await writeFile(path.join(dir, filename), bytes);

    const url = `${UPLOAD_URL_PREFIX}avatars/${filename}`;
    await prisma.customer.update({ where: { id: session.id }, data: { avatar: url } });

    return NextResponse.json({ ok: true, url });
  } catch (err: any) {
    console.error('[customer/avatar] upload failed:', err?.message || err);
    return NextResponse.json({ error: 'Could not save the image' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Please sign in' }, { status: 401 });

  try {
    await prisma.customer.update({ where: { id: session.id }, data: { avatar: null } });
    // The file itself is left on disk: another request may still be serving it,
    // and an orphaned avatar costs a few kilobytes where a race costs a broken
    // image. The next upload writes a new filename.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Could not remove the photo' }, { status: 500 });
  }
}
