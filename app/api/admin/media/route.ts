import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * POST /api/admin/media
 * Two modes:
 *  1. JSON body  { url, filename, ... }  → register an external/remote URL
 *  2. multipart  file upload             → writes to /public/uploads
 *
 * NOTE: uploaded files are served by the route handler at `app/uploads/[...path]/route.ts`,
 * not by Next.js static serving. Next snapshots `public/` at boot, so files written at
 * runtime would otherwise 404 in production. Do not remove that route.
 *
 * For a serverless host (Vercel) the local disk is read-only/ephemeral — switch mode 2 to
 * object storage (S3, Cloudinary, R2) and return the resulting absolute URL instead.
 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    // Guard: 8 MB max
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 8 MB)' }, { status: 413 });
    }

    const { writeFile, mkdir } = await import('fs/promises');
    const path = await import('path');
    const bytes = Buffer.from(await file.arrayBuffer());

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
    const filename = `${Date.now()}-${safe}`;
    const dir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), bytes);

    const media = await prisma.media.create({
      data: {
        filename: file.name,
        url: `/uploads/${filename}`,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        folder: 'uploads',
      },
    });

    return NextResponse.json({ ok: true, media });
  }

  // JSON mode — register a remote URL
  const body = await req.json().catch(() => null);
  if (!body?.url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  const media = await prisma.media.create({
    data: {
      filename: body.filename || String(body.url).split('/').pop() || 'image',
      url: String(body.url),
      mimeType: body.mimeType || 'image/jpeg',
      size: body.size ? Number(body.size) : null,
      alt: body.alt || null,
      folder: body.folder || 'library',
    },
  });

  return NextResponse.json({ ok: true, media });
}

/** DELETE /api/admin/media?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Best-effort removal of locally uploaded files
  if (media.url.startsWith('/uploads/')) {
    try {
      const { unlink } = await import('fs/promises');
      const path = await import('path');
      await unlink(path.join(process.cwd(), 'public', media.url));
    } catch {
      /* file already gone — ignore */
    }
  }

  await prisma.media.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
