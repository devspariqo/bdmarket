import type { Metadata } from 'next';
import { AlertTriangle } from 'lucide-react';
import prisma from '@/lib/db';
import { formatNumber } from '@/lib/utils';
import { UPLOAD_DIR, isUploadDirEphemeral } from '@/lib/uploads';
import MediaLibrary from '@/components/admin/MediaLibrary';

export const metadata: Metadata = { title: 'Media Library' };
export const dynamic = 'force-dynamic';

export default async function AdminMediaPage() {
  const media = await prisma.media.findMany({ orderBy: { createdAt: 'desc' }, take: 300 });

  const totalSize = media.reduce((s, m) => s + (m.size || 0), 0);
  const images = media.filter((m) => (m.mimeType || '').startsWith('image/')).length;
  const ephemeral = isUploadDirEphemeral();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Content</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Media Library
          </h1>
          <p className="mt-1 text-[15px] text-ink-500">
            {formatNumber(media.length)} files · {images} images · {(totalSize / 1024 / 1024).toFixed(1)} MB stored
          </p>
        </div>
      </header>

      {/* Surfaces a failure that is otherwise invisible until a redeploy wipes
          every uploaded image and the database is left pointing at 404s. */}
      {ephemeral && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="text-[14px] leading-relaxed text-amber-900">
            <p className="font-bold">Uploads are being stored inside the application folder.</p>
            <p className="mt-1">
              Currently writing to <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[13px]">{UPLOAD_DIR}</code>.
              Some hosts replace that folder on every deploy, which deletes uploaded logos and product
              photos while the database keeps the paths — every image then shows as broken. Set the{' '}
              <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[13px]">UPLOAD_DIR</code>{' '}
              environment variable to a folder outside the application, for example{' '}
              <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[13px]">/home/youruser/uploads</code>,
              then redeploy. No database change is needed.
            </p>
          </div>
        </div>
      )}

      <MediaLibrary
        initial={media.map((m) => ({
          id: m.id,
          filename: m.filename,
          url: m.url,
          mimeType: m.mimeType,
          size: m.size,
          alt: m.alt,
          folder: m.folder,
          created: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
