import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

/** PATCH /api/admin/reviews — approve / reject / spam / mark verified / reply. */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status, ids, verified } = await req.json().catch(() => ({}));

  // Bulk status change
  if (Array.isArray(ids) && ids.length && status) {
    await prisma.review.updateMany({ where: { id: { in: ids } }, data: { status } });
    await recomputeFor(ids);
    return NextResponse.json({ ok: true, count: ids.length });
  }

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const data: Record<string, any> = {};
  if (status) data.status = status;
  if (verified !== undefined) data.verified = !!verified;

  const review = await prisma.review.update({ where: { id }, data });
  await recomputeFor([review.productId]);

  return NextResponse.json({ ok: true, review });
}

/** DELETE /api/admin/reviews?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const review = await prisma.review.delete({ where: { id } });
  await recomputeFor([review.productId]);
  return NextResponse.json({ ok: true });
}

/** Recompute the cached rating + reviewCount for the given products. */
async function recomputeFor(productIds: string[]) {
  const unique = [...new Set(productIds.filter(Boolean))];
  for (const productId of unique) {
    const agg = await prisma.review.aggregate({
      where: { productId, status: 'approved' },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: Math.round((agg._avg.rating || 0) * 10) / 10,
        reviewCount: agg._count,
      },
    });
  }
}
