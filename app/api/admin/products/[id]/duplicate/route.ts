import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const original = await prisma.product.findUnique({ where: { id: params.id } });
    if (!original) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const suffix = Date.now().toString(36).slice(-5);

    const copy = await prisma.product.create({
      data: {
        name: `${original.name} (Copy)`,
        nameBn: original.nameBn,
        slug: `${original.slug}-copy-${suffix}`,
        sku: `${original.sku}-C${suffix.toUpperCase()}`,
        barcode: null,
        type: original.type,
        description: original.description,
        shortDesc: original.shortDesc,
        price: original.price,
        comparePrice: original.comparePrice,
        costPrice: original.costPrice,
        stock: 0,
        lowStockAlert: original.lowStockAlert,
        manageStock: original.manageStock,
        stockStatus: 'outofstock',
        weight: original.weight,
        dimensions: original.dimensions,
        categoryId: original.categoryId,
        brandId: original.brandId,
        images: original.images,
        tags: original.tags,
        attributes: original.attributes,
        variants: original.variants,
        featured: false,
        bestseller: false,
        newArrival: true,
        status: 'draft',
        fabric: original.fabric,
        occasion: original.occasion,
        fit: original.fit,
        careInstructions: original.careInstructions,
        countryOfOrigin: original.countryOfOrigin,
        metaTitle: original.metaTitle,
        metaDesc: original.metaDesc,
        metaKeywords: original.metaKeywords,
        ogImage: original.ogImage,
      },
    });

    await prisma.auditLog.create({
      data: { userId: session.id, action: 'DUPLICATE', entity: 'product', entityId: copy.id, meta: JSON.stringify({ from: original.id }) },
    });

    return NextResponse.json({ ok: true, product: copy });
  } catch (e: any) {
    console.error('duplicate product', e);
    return NextResponse.json({ error: 'Failed to duplicate product' }, { status: 500 });
  }
}
