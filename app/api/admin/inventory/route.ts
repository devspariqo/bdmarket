import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

/** GET /api/admin/inventory?filter=low|out|all */
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const filter = new URL(req.url).searchParams.get('filter') || 'all';
  const where =
    filter === 'low'
      ? { stock: { lte: 10, gt: 0 } }
      : filter === 'out'
      ? { stock: { lte: 0 } }
      : {};

  const products = await prisma.product.findMany({
    where,
    select: {
      id: true, name: true, sku: true, stock: true, lowStockAlert: true,
      price: true, costPrice: true, images: true, status: true,
      category: { select: { name: true } },
    },
    orderBy: { stock: 'asc' },
  });

  return NextResponse.json({ products });
}

/**
 * PATCH /api/admin/inventory
 * Body: { updates: [{ id, stock?, lowStockAlert?, price?, costPrice? }] }
 * Batch-applies inventory changes from the inventory table.
 */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { updates } = await req.json().catch(() => ({}));
  if (!Array.isArray(updates) || !updates.length) {
    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  }

  await prisma.$transaction(
    updates.map((u: any) => {
      const data: Record<string, any> = {};
      if (u.stock !== undefined && u.stock !== null && u.stock !== '') {
        data.stock = Math.max(0, Number(u.stock));
        data.stockStatus = Number(u.stock) <= 0 ? 'outofstock' : 'instock';
      }
      if (u.lowStockAlert !== undefined && u.lowStockAlert !== '') data.lowStockAlert = Number(u.lowStockAlert);
      if (u.price !== undefined && u.price !== '') data.price = Number(u.price);
      if (u.costPrice !== undefined && u.costPrice !== '') data.costPrice = Number(u.costPrice);
      return prisma.product.update({ where: { id: u.id }, data });
    })
  );

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: 'inventory.update',
      entity: 'Product',
      meta: JSON.stringify({ count: updates.length }),
    },
  });

  return NextResponse.json({ ok: true, updated: updates.length });
}
