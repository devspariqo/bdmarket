import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { formatNumber, formatDate } from '@/lib/utils';
import PageManager from '@/components/admin/PageManager';

export const metadata: Metadata = { title: 'Pages' };
export const dynamic = 'force-dynamic';

export default async function AdminPagesPage() {
  const pages = await prisma.page.findMany({ orderBy: [{ menuOrder: 'asc' }, { title: 'asc' }] });

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Content</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Pages</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Static content pages — About, Contact, Terms, Privacy, Return Policy and anything else your store needs.
        </p>
      </header>

      <PageManager
        pages={pages.map((p) => ({
          id: p.id,
          title: p.title,
          titleBn: p.titleBn,
          slug: p.slug,
          content: p.content,
          excerpt: p.excerpt,
          template: p.template,
          status: p.status,
          showInMenu: p.showInMenu,
          menuOrder: p.menuOrder,
          featuredImage: p.featuredImage,
          metaTitle: p.metaTitle,
          metaDesc: p.metaDesc,
          metaKeywords: p.metaKeywords,
          updated: formatDate(p.updatedAt),
        }))}
      />
    </div>
  );
}
