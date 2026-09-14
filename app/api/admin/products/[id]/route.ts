import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    // SKU uniqueness check (excluding self)
    if (body.sku && body.sku !== existing.sku) {
      const dup = await prisma.product.findUnique({ where: { sku: body.sku } });
      if (dup) return NextResponse.json({ error: `SKU "${body.sku}" is already used by another product` }, { status: 409 });
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: body.name ?? existing.name,
        nameBn: body.nameBn ?? existing.nameBn,
        slug: body.slug ? (body.slug === existing.slug ? existing.slug : slugify(body.slug)) : existing.slug,
        sku: body.sku ?? existing.sku,
        barcode: body.barcode ?? existing.barcode,
        type: body.type ?? existing.type,
        description: body.description ?? existing.description,
        shortDesc: body.shortDesc ?? existing.shortDesc,
        price: body.price !== undefined ? Number(body.price) : existing.price,
        comparePrice: body.comparePrice !== undefined ? (body.comparePrice === null ? null : Number(body.comparePrice)) : existing.comparePrice,
        costPrice: body.costPrice !== undefined ? (body.costPrice === null ? null : Number(body.costPrice)) : existing.costPrice,
        stock: body.stock !== undefined ? Number(body.stock) : existing.stock,
        lowStockAlert: body.lowStockAlert !== undefined ? Number(body.lowStockAlert) : existing.lowStockAlert,
        manageStock: body.manageStock ?? existing.manageStock,
        stockStatus: body.stock !== undefined ? (Number(body.stock) > 0 ? 'instock' : 'outofstock') : existing.stockStatus,
        weight: body.weight !== undefined ? (body.weight === null ? null : Number(body.weight)) : existing.weight,
        dimensions: body.dimensions ?? existing.dimensions,
        categoryId: body.categoryId !== undefined ? (body.categoryId || null) : existing.categoryId,
        brandId: body.brandId !== undefined ? (body.brandId || null) : existing.brandId,
        images: body.images ? JSON.stringify(body.images) : existing.images,
        tags: body.tags ?? existing.tags,
        attributes: body.attributes ? JSON.stringify(body.attributes) : existing.attributes,
        variants: body.variants ? (body.variants.length ? JSON.stringify(body.variants) : null) : existing.variants,
        featured: body.featured ?? existing.featured,
        bestseller: body.bestseller ?? existing.bestseller,
        newArrival: body.newArrival ?? existing.newArrival,
        status: body.status ?? existing.status,
        fabric: body.fabric ?? existing.fabric,
        occasion: body.occasion ?? existing.occasion,
        fit: body.fit ?? existing.fit,
        careInstructions: body.careInstructions ?? existing.careInstructions,
        countryOfOrigin: body.countryOfOrigin ?? existing.countryOfOrigin,
        metaTitle: body.metaTitle ?? existing.metaTitle,
        metaDesc: body.metaDesc ?? existing.metaDesc,
        metaKeywords: body.metaKeywords ?? existing.metaKeywords,
        ogImage: body.images?.[0] ?? existing.ogImage,
      },
    });

    await prisma.auditLog.create({
      data: { userId: session.id, action: 'UPDATE', entity: 'product', entityId: product.id, meta: JSON.stringify({ name: product.name }) },
    });

    return NextResponse.json({ ok: true, product });
  } catch (e: any) {
    console.error('update product', e);
    return NextResponse.json({ error: e.message || 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const product = await prisma.product.findUnique({ where: { id: params.id } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    await prisma.product.delete({ where: { id: params.id } });

    await prisma.auditLog.create({
      data: { userId: session.id, action: 'DELETE', entity: 'product', entityId: params.id, meta: JSON.stringify({ name: product.name }) },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
