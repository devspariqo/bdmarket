import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { toCSV, parseJSON } from '@/lib/utils';

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const products = await prisma.product.findMany({
    include: { category: { select: { name: true } }, brand: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const rows = products.map((p) => ({
    ID: p.id,
    Name: p.name,
    NameBn: p.nameBn || '',
    SKU: p.sku,
    Slug: p.slug,
    Category: p.category?.name || '',
    Brand: p.brand?.name || '',
    Price: p.price,
    ComparePrice: p.comparePrice || '',
    CostPrice: p.costPrice || '',
    Stock: p.stock,
    Status: p.status,
    Featured: p.featured,
    Bestseller: p.bestseller,
    SoldCount: p.soldCount,
    Rating: p.rating,
    ReviewCount: p.reviewCount,
    Fabric: p.fabric || '',
    ImageCount: parseJSON<string[]>(p.images, []).length,
    MetaTitle: p.metaTitle || '',
    MetaDesc: p.metaDesc || '',
    CreatedAt: new Date(p.createdAt).toISOString(),
  }));

  const csv = toCSV(rows);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bd-market-products-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
