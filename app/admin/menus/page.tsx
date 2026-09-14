import type { Metadata } from 'next';
import prisma from '@/lib/db';
import { parseJSON } from '@/lib/utils';
import MenuBuilder from '@/components/admin/MenuBuilder';

export const metadata: Metadata = { title: 'Menus' };
export const dynamic = 'force-dynamic';

type MenuItem = { label: string; labelBn?: string; href: string; children?: { label: string; href: string }[] };

export default async function AdminMenusPage() {
  const [menus, categories, pages] = await Promise.all([
    prisma.menu.findMany({ orderBy: { location: 'asc' } }),
    prisma.category.findMany({
      where: { parentId: null, status: 'active' },
      select: { id: true, name: true, slug: true, children: { select: { name: true, slug: true } } },
      orderBy: { position: 'asc' },
    }),
    prisma.page.findMany({ where: { status: 'published' }, select: { title: true, slug: true }, orderBy: { menuOrder: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">Content</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Menus</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Build your navigation. The header menu powers the mega-dropdown, footer menus fill the site footer, and the
          mobile menu appears in the drawer on phones.
        </p>
      </header>

      <MenuBuilder
        menus={menus.map((m) => ({
          id: m.id,
          name: m.name,
          location: m.location,
          status: m.status,
          items: parseJSON<MenuItem[]>(m.items, []),
        }))}
        linkSources={{
          categories: categories.map((c) => ({
            label: c.name,
            href: `/category/${c.slug}`,
            children: c.children.map((k) => ({ label: k.name, href: `/category/${k.slug}` })),
          })),
          pages: pages.map((p) => ({ label: p.title, href: `/pages/${p.slug}` })),
          static: [
            { label: 'Shop All', href: '/shop' },
            { label: 'New Arrivals', href: '/shop?sort=newest' },
            { label: 'Sale', href: '/shop?sale=1' },
            { label: 'Brands', href: '/brands' },
            { label: 'Blog', href: '/blog' },
            { label: 'Track Order', href: '/pages/track-order' },
            { label: 'Contact', href: '/pages/contact' },
          ],
        }}
      />
    </div>
  );
}
