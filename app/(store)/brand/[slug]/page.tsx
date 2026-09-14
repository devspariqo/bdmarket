import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import ProductCard from '@/components/store/ProductCard';
import { formatNumber } from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const brand = await prisma.brand.findUnique({ where: { slug: params.slug } });
  if (!brand) return { title: 'Brand Not Found' };
  return {
    title: `${brand.name} Products`,
    description: brand.description || `Shop ${brand.name} products online in Bangladesh with cash on delivery.`,
    alternates: { canonical: `/brand/${brand.slug}` },
  };
}

export default async function BrandPage({ params }: { params: { slug: string } }) {
  const brand = await prisma.brand.findUnique({ where: { slug: params.slug } });
  if (!brand || brand.status !== 'active') notFound();

  const products = await prisma.product.findMany({
    where: { status: 'published', brandId: brand.id },
    orderBy: [{ featured: 'desc' }, { soldCount: 'desc' }],
    include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
  });

  const config = await getSiteConfig();

  return (
    <div>
      <section className="border-b border-ink-100 bg-gradient-to-br from-brand-50 to-white py-12">
        <div className="container-x">
          <nav className="mb-3 text-[13px] text-ink-500">
            <Link href="/" className="hover:text-brand-700">Home</Link> <span>/</span>{' '}
            <Link href="/brands" className="hover:text-brand-700">Brands</Link> <span>/</span>{' '}
            <span className="font-semibold text-ink-800">{brand.name}</span>
          </nav>
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 font-display text-2xl font-bold text-white shadow-lg">
              {brand.name.charAt(0)}
            </span>
            <div>
              <h1 className="font-display text-3xl font-bold text-ink-900">{brand.name}</h1>
              {brand.country && <p className="mt-0.5 text-[13px] font-semibold uppercase tracking-wide text-ink-500">{brand.country}</p>}
            </div>
          </div>
          {brand.description && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-600">{brand.description}</p>}
          <p className="mt-3 text-[13px] text-ink-500">{formatNumber(products.length)} products available</p>
        </div>
      </section>

      <div className="container-x py-8">
        {products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-ink-50/50 py-20 text-center">
            <h3 className="text-lg font-bold text-ink-800">No products from {brand.name} yet</h3>
            <Link href="/shop" className="btn-primary mt-5">Browse all products</Link>
          </div>
        )}
      </div>
    </div>
  );
}
