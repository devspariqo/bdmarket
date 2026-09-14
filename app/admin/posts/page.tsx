import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { formatDate } from '@/lib/utils';
import PostManager from '@/components/admin/PostManager';

export const metadata: Metadata = { title: 'Blog Posts' };
export const dynamic = 'force-dynamic';

export default async function AdminPostsPage() {
  const posts = await prisma.post.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Content</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Blog Posts</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Editorial content for organic search — style guides, festival lookbooks, size charts and buying tips.
        </p>
      </header>

      <PostManager
        posts={posts.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          content: p.content,
          coverImage: p.coverImage,
          category: p.category,
          tags: p.tags,
          authorName: p.authorName,
          status: p.status,
          featured: p.featured,
          readMinutes: p.readMinutes,
          viewCount: p.viewCount,
          metaTitle: p.metaTitle,
          metaDesc: p.metaDesc,
          publishedAt: p.publishedAt.toISOString().slice(0, 10),
          created: formatDate(p.createdAt),
        }))}
      />
    </div>
  );
}
