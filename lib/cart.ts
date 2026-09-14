import { cookies } from 'next/headers';
import prisma from './db';
import { getCustomerSession } from './auth';

const CART_COOKIE = 'bdm_cart';

export async function getOrCreateCartToken(): Promise<string> {
  const existing = cookies().get(CART_COOKIE)?.value;
  if (existing) return existing;
  return 'pending-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function newCartToken() {
  return 'cart_' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

export async function getCart() {
  const token = cookies().get(CART_COOKIE)?.value;
  if (!token) return null;
  return prisma.cart.findUnique({
    where: { token },
    include: {
      items: {
        include: { product: true },
        orderBy: { id: 'asc' },
      },
    },
  });
}

export async function getCartWithTotals() {
  const cart = await getCart();
  if (!cart) {
    return {
      cart: null,
      items: [],
      count: 0,
      subtotal: 0,
      discount: 0,
      shipping: 0,
      total: 0,
      coupon: null as null | { code: string; value: number; type: string; description?: string | null },
    };
  }

  const items = cart.items.map((it) => ({
    id: it.id,
    productId: it.productId,
    slug: it.product.slug,
    name: it.product.name,
    image: safeFirstImage(it.product.images),
    price: it.price,
    qty: it.qty,
    variant: it.variant,
    stock: it.product.stock,
    maxQty: Math.max(1, Math.min(it.product.stock, 10)),
    lineTotal: it.price * it.qty,
  }));

  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  let discount = 0;
  let coupon: any = null;
  if (cart.couponCode) {
    const c = await prisma.coupon.findUnique({ where: { code: cart.couponCode } });
    if (c && c.status === 'active' && subtotal >= c.minOrder) {
      coupon = { code: c.code, value: c.value, type: c.type, description: c.description };
      if (c.type === 'percent') discount = (subtotal * c.value) / 100;
      else if (c.type === 'fixed') discount = c.value;
      else if (c.type === 'freeship') discount = 0;
      if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
      discount = Math.min(discount, subtotal);
    }
  }

  const shippingSettingRows = await prisma.setting.findMany({
    where: { key: { in: ['shipping_free_over', 'shipping_default_rate', 'shipping_enabled'] } },
  });
  const sm = Object.fromEntries(shippingSettingRows.map((r) => [r.key, r.value]));
  const freeOver = Number(sm.shipping_free_over || 2000);
  const baseRate = Number(sm.shipping_default_rate || 80);
  const shippingEnabled = sm.shipping_enabled !== 'false';

  let shipping = shippingEnabled ? baseRate : 0;
  if (subtotal - discount >= freeOver && freeOver > 0) shipping = 0;
  if (coupon?.type === 'freeship') shipping = 0;

  const total = Math.max(0, subtotal - discount + shipping);

  return { cart, items, count, subtotal, discount, shipping, total, coupon };
}

export function safeFirstImage(images: string | null | undefined): string {
  if (!images) return '';
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length ? arr[0] : '';
  } catch {
    return images;
  }
}

export async function getCartCount() {
  const token = cookies().get(CART_COOKIE)?.value;
  if (!token) return 0;
  const items = await prisma.cartItem.findMany({ where: { cart: { token } } });
  return items.reduce((s, i) => s + i.qty, 0);
}

export async function attachCartToCustomer() {
  const session = await getCustomerSession();
  if (!session) return;
  const token = cookies().get(CART_COOKIE)?.value;
  if (!token) return;
  await prisma.cart.updateMany({ where: { token }, data: { customerId: session.id } });
}

export const CART_COOKIE_NAME = CART_COOKIE;
