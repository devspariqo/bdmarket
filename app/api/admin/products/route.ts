import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

  const where: any = {};
  if (q) where.OR = [{ name: { contains: q } }, { sku: { contains: q } }];

  const products = await prisma.product.findMany({
    where,
    take: limit,
    orderBy: { updatedAt: 'desc' },
    include: { category: { select: { name: true } }, brand: { select: { name: true } } },
  });

  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();

    if (!body.name?.trim()) return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    if (!body.sku?.trim()) return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    if (!body.price || Number(body.price) <= 0)
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });

    const slug = body.slug || slugify(body.name);
    const slugExists = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = slugExists ? `${slug}-${Date.now().toString(36).slice(-4)}` : slug;

    const skuExists = await prisma.product.findUnique({ where: { sku: body.sku } });
    if (skuExists) return NextResponse.json({ error: `SKU "${body.sku}" already exists` }, { status: 409 });

    const product = await prisma.product.create({
      data: {
        name: body.name.trim(),
        nameBn: body.nameBn || null,
        slug: finalSlug,
        sku: body.sku.trim().toUpperCase(),
        barcode: body.barcode || null,
        type: body.type || 'simple',
        description: body.description || null,
        shortDesc: body.shortDesc || null,
        price: Number(body.price),
        comparePrice: body.comparePrice ? Number(body.comparePrice) : null,
        costPrice: body.costPrice ? Number(body.costPrice) : null,
        stock: Number(body.stock) || 0,
        lowStockAlert: Number(body.lowStockAlert) || 5,
        manageStock: body.manageStock ?? true,
        stockStatus: Number(body.stock) > 0 ? 'instock' : 'outofstock',
        weight: body.weight ? Number(body.weight) : null,
        dimensions: body.dimensions || null,
        categoryId: body.categoryId || null,
        brandId: body.brandId || null,
        images: JSON.stringify(body.images || []),
        tags: body.tags || null,
        attributes: JSON.stringify(body.attributes || []),
        variants: body.variants?.length ? JSON.stringify(body.variants) : null,
        featured: !!body.featured,
        bestseller: !!body.bestseller,
        newArrival: body.newArrival ?? true,
        status: body.status || 'draft',
        fabric: body.fabric || null,
        occasion: body.occasion || null,
        fit: body.fit || null,
        careInstructions: body.careInstructions || null,
        countryOfOrigin: body.countryOfOrigin || 'Bangladesh',
        metaTitle: body.metaTitle || null,
        metaDesc: body.metaDesc || null,
        metaKeywords: body.metaKeywords || null,
        ogImage: body.images?.[0] || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session.id, action: 'CREATE', entity: 'product', entityId: product.id,
        meta: JSON.stringify({ name: product.name, sku: product.sku }),
      },
    });

    return NextResponse.json({ ok: true, product });
  } catch (e: any) {
    console.error('create product', e);
    return NextResponse.json({ error: e.message || 'Failed to create product' }, { status: 500 });
  }
}
