import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { getOrCreateCartToken } from '@/lib/cart';

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    const token = cookies().get('bdm_cart')?.value;
    if (!token) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });

    const cart = await prisma.cart.findUnique({
      where: { token },
      include: { items: { include: { product: true } } },
    });
    if (!cart) return NextResponse.json({ error: 'Cart not found' }, { status: 404 });

    if (!code) {
      await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
      return NextResponse.json({ ok: true, removed: true });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: String(code).toUpperCase().trim() } });
    if (!coupon) return NextResponse.json({ error: 'Coupon code not found' }, { status: 404 });
    if (coupon.status !== 'active') return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });

    const subtotal = cart.items.reduce((s, i) => s + i.price * i.qty, 0);
    if (subtotal < coupon.minOrder)
      return NextResponse.json(
        { error: `Minimum order ৳${coupon.minOrder.toLocaleString()} required for this coupon` },
        { status: 400 }
      );

    await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: coupon.code } });

    return NextResponse.json({
      ok: true,
      coupon: { code: coupon.code, type: coupon.type, value: coupon.value, description: coupon.description },
    });
  } catch (e) {
    console.error('coupon', e);
    return NextResponse.json({ error: 'Failed to apply coupon' }, { status: 500 });
  }
}
