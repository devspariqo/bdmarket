import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';

const CART_COOKIE = 'bdm_cart';

async function getOrCreateCart() {
  const token = cookies().get(CART_COOKIE)?.value;
  const session = await getCustomerSession();

  if (token) {
    const existing = await prisma.cart.findUnique({ where: { token } });
    if (existing) return existing;
    return prisma.cart.create({ data: { token, customerId: session?.id || null } });
  }

  const newToken = 'cart_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
  const cart = await prisma.cart.create({ data: { token: newToken, customerId: session?.id || null } });
  cookies().set(CART_COOKIE, newToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return cart;
}

export async function GET() {
  const cart = await getOrCreateCart();
  const items = await prisma.cartItem.findMany({
    where: { cartId: cart.id },
    include: { product: { select: { id: true, name: true, slug: true, price: true, images: true, stock: true } } },
  });
  return NextResponse.json({ cart: { id: cart.id, token: cart.token, couponCode: cart.couponCode }, items });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, variant = null, qty = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    if (product.stock <= 0) return NextResponse.json({ error: 'Out of stock' }, { status: 400 });

    const cart = await getOrCreateCart();

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, variant: variant || null },
    });

    const addQty = Math.max(1, Math.min(Number(qty) || 1, product.stock));

    if (existing) {
      const newQty = Math.min(existing.qty + addQty, product.stock);
      await prisma.cartItem.update({ where: { id: existing.id }, data: { qty: newQty } });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, variant: variant || null, qty: addQty, price: product.price },
      });
    }

    const items = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
    const count = items.reduce((s, i) => s + i.qty, 0);

    return NextResponse.json({ ok: true, count, cartId: cart.id });
  } catch (e) {
    console.error('cart POST', e);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { itemId, qty } = await req.json();
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 });

    const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { product: true } });
    if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { qty: Math.min(Number(qty), item.product.stock) },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const all = searchParams.get('all');
    const token = cookies().get(CART_COOKIE)?.value;
    if (!token) return NextResponse.json({ ok: true });

    const cart = await prisma.cart.findUnique({ where: { token } });
    if (!cart) return NextResponse.json({ ok: true });

    if (all === '1') {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    } else if (itemId) {
      await prisma.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove' }, { status: 500 });
  }
}
