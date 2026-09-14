import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { formatNumber } from '@/lib/utils';
import MediaLibrary from '@/components/admin/MediaLibrary';

export const metadata: Metadata = { title: 'Media Library' };
export const dynamic = 'force-dynamic';

export default async function AdminMediaPage() {
  const media = await prisma.media.findMany({ orderBy: { createdAt: 'desc' }, take: 300 });

  const totalSize = media.reduce((s, m) => s + (m.size || 0), 0);
  const images = media.filter((m) => (m.mimeType || '').startsWith('image/')).length;

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
