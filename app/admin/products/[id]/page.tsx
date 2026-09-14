import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import prisma from '@/lib/db';
import ProductEditor from '@/components/admin/ProductEditor';

export const metadata: Metadata = { title: 'Edit Product' };
export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: { id: string } }) {
  if (params.id === 'new') {
    const [categories, brands] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, parentId: true } }),
      prisma.brand.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    ]);
    return (
      <div className="space-y-5">
        <div>
          <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to products
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Add New Product</h1>
        </div>
        <ProductEditor categories={categories} brands={brands} product={null} />
      </div>
    );
  }

  const [product, categories, brands] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, parentId: true } }),
    prisma.brand.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
  ]);

  if (!product) notFound();

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/products" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-700 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to products
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900">Edit Product</h1>
          <p className="mt-1 text-[15px] text-ink-500">{product.name}</p>
        </div>
        <Link href={`/product/${product.slug}`} target="_blank" className="btn-outline btn-sm">
          <ExternalLink className="h-3.5 w-3.5" /> View on store
        </Link>
      </div>

      <ProductEditor categories={categories} brands={brands} product={product} />
    </div>
  );
}
