import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { productId, rating, authorName, authorEmail, title, body } = await req.json();

    if (!productId || !rating || !authorName || !body) {
      return NextResponse.json({ error: 'Please fill in all required fields' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    const session = await getCustomerSession();

    const autoApprove = await prisma.setting.findUnique({ where: { key: 'reviews_auto_approve' } });
    const approved = autoApprove?.value === 'true';

    await prisma.review.create({
      data: {
        productId,
        customerId: session?.id || null,
        authorName,
        authorEmail: authorEmail || session?.email || '',
        rating: Math.max(1, Math.min(5, Number(rating))),
        title: title || null,
        body,
        status: approved ? 'approved' : 'pending',
        verified: !!session,
      },
    });

    // Recalculate product rating from approved reviews
    const agg = await prisma.review.aggregate({
      where: { productId, status: 'approved' },
      _avg: { rating: true },
      _count: { _all: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        rating: agg._avg.rating || product.rating,
        reviewCount: agg._count._all,
      },
    });

    return NextResponse.json({ ok: true, pending: !approved });
  } catch (e) {
    console.error('review', e);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
