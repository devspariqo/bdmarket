import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { orderNumber } from '@/lib/utils';
import { getCustomerSession } from '@/lib/auth';
import { notifyOrderPlaced } from '@/lib/notifications';
import { parseBlocks, findCheckoutBlock } from '@/lib/landing-blocks';

export const dynamic = 'force-dynamic';

/**
 * POST /api/landing-order
 *
 * Places an order from a landing page's embedded form.
 *
 * Separate from `/api/checkout` on purpose. That route is built around a cart —
 * a cart token, cart items, coupon state — and a funnel has none of that: it has
 * one product, a quantity and a delivery address. Sharing the route would mean
 * carrying a cart the visitor never had.
 *
 * What it does share is everything that must not diverge: the shipping-zone
 * lookup, the order shape, the stock decrement and the email/SMS notification
 * path. An order placed here is indistinguishable from one placed in the cart
 * checkout, except that it records which landing page produced it.
 */

/** Human labels for field-level errors, so the message can name the field. */
const LABELS: Record<string, string> = {
  customerName: 'Full name',
  phone: 'Mobile number',
  email: 'Email',
  division: 'Division',
  district: 'District',
  area: 'Area',
  street: 'Address',
  postcode: 'Postcode',
  customerNote: 'Order note',
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    const { pageId, productId } = body;
    const qty = Math.max(1, Math.min(99, Number(body.qty) || 1));

    if (!pageId || !productId) {
      return NextResponse.json({ error: 'Missing page or product' }, { status: 400 });
    }

    const page = await prisma.landingPage.findFirst({
      where: { id: String(pageId), status: 'published' },
    });
    if (!page) return NextResponse.json({ error: 'This page is no longer available' }, { status: 404 });

    const checkout = findCheckoutBlock(parseBlocks(page.blocks));
    if (!page.checkoutEnabled || !checkout) {
      return NextResponse.json({ error: 'Ordering is not available on this page' }, { status: 400 });
    }

    /**
     * Validate against the block's own required list, not a hardcoded one.
     *
     * The client checks the same list for instant feedback, but this is the copy
     * that matters — the client list is editable in devtools. Reading it from the
     * page record also means the merchant can change which fields are mandatory
     * without a deploy.
     */
    const required: string[] = (Array.isArray(checkout.props?.required) ? checkout.props.required : [])
      .map((f: any) => (typeof f === 'string' ? f : f?.value))
      .filter(Boolean);

    const text = (key: string) => String(body[key] ?? '').trim();

    const errors: Record<string, string> = {};
    for (const key of required) {
      if (!text(key)) errors[key] = `${LABELS[key] || key} is required`;
    }
    if (text('phone') && !/^(\+?880|0)?1[3-9]\d{8}$/.test(text('phone').replace(/[\s-]/g, ''))) {
      errors.phone = 'Enter a valid Bangladeshi mobile number';
    }
    if (text('email') && !/^\S+@\S+\.\S+$/.test(text('email'))) {
      errors.email = 'Enter a valid email address';
    }
    if (Object.keys(errors).length) {
      return NextResponse.json({ error: 'Please check the highlighted fields', errors }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { id: String(productId), status: 'published' },
    });
    if (!product) return NextResponse.json({ error: 'That product is no longer available' }, { status: 404 });
    if (product.stock < qty) {
      return NextResponse.json(
        { error: `Only ${product.stock} left in stock` },
        { status: 400 }
      );
    }

    const email = text('email').toLowerCase();
    const phone = text('phone');
    const customerName = text('customerName') || 'Customer';
    // The order requires a division and district; a funnel that does not ask for
    // them still has to record something, and Dhaka is the sane default for a
    // Bangladeshi store.
    const division = text('division') || 'Dhaka';
    const district = text('district') || 'Dhaka';
    const area = text('area');
    const street = text('street');
    const postcode = text('postcode');
    const customerNote = text('customerNote');

    const subtotal = product.price * qty;

    // Shipping, resolved exactly as the cart checkout does.
    const zone = await prisma.shippingZone.findFirst({
      where: { OR: [{ districts: { contains: district } }, { districts: 'ALL' }], status: 'active' },
      orderBy: { position: 'asc' },
    });
    const settingRows = await prisma.setting.findMany({
      where: { key: { in: ['shipping_default_rate', 'shipping_free_over', 'shipping_enabled'] } },
    });
    const sm = Object.fromEntries(settingRows.map((r) => [r.key, r.value]));
    const freeOver = Number(sm.shipping_free_over || 2000);
    const defaultRate = Number(sm.shipping_default_rate || 100);

    let shippingCost = zone ? zone.rate : defaultRate;
    if (sm.shipping_enabled === 'false') shippingCost = 0;
    const zoneFreeOver = zone?.freeOver ?? freeOver;
    if (zoneFreeOver > 0 && subtotal >= zoneFreeOver) shippingCost = 0;

    const total = Math.max(0, subtotal + shippingCost);

    // Link to a customer when we have an email to match on. `Customer.email` is
    // unique and non-null, so a form that does not collect one must NOT create a
    // blank-email row — the second such order would collide on the unique index.
    let customerId: string | null = null;
    if (email) {
      const existing = await prisma.customer.findUnique({ where: { email } });
      if (existing) {
        customerId = existing.id;
      } else {
        const created = await prisma.customer.create({
          data: {
            email,
            name: customerName,
            phone: phone || null,
            district: district || null,
          },
        });
        customerId = created.id;
      }
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        landingPageId: page.id,
        customerId,
        email,
        phone: phone || '—',
        customerName,
        status: 'PENDING',
        paymentStatus: 'unpaid',
        paymentMethod: 'cod',
        subtotal,
        discount: 0,
        shippingCost,
        total,
        shippingMethod: shippingCost === 0 ? 'Free Delivery' : 'Standard Delivery',
        shippingZone: zone?.name || 'Standard',
        shipDivision: division,
        shipDistrict: district,
        shipArea: area,
        shipStreet: street || '—',
        shipPostcode: postcode,
        customerNote: customerNote || null,
        ipAddress: req.headers.get('x-forwarded-for') || 'local',
        userAgent: req.headers.get('user-agent') || '',
        items: {
          create: {
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            image: safeFirst(product.images),
            price: product.price,
            qty,
            total: subtotal,
          },
        },
        timeline: {
          create: {
            status: 'PENDING',
            note: `Order placed on landing page "${page.title}"`,
            by: 'Customer',
          },
        },
      },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { stock: { decrement: qty }, soldCount: { increment: qty } },
    });

    if (customerId) {
      await prisma.customer
        .update({ where: { id: customerId }, data: { orderCount: { increment: 1 } } })
        .catch(() => {});
    }

    // Same notification path as the cart checkout: confirmation to the buyer, a
    // "new order" alert to the store, over email and SMS.
    try {
      await notifyOrderPlaced(order.id);
    } catch (e: any) {
      console.error('[landing-order] notifications failed:', e?.message || e);
    }

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      total: order.total,
    });
  } catch (err: any) {
    console.error('[landing-order] failed:', err?.message || err);
    return NextResponse.json(
      { error: 'We could not place the order. Please try again.' },
      { status: 500 }
    );
  }
}

/** First image from a product's JSON array, tolerating a malformed value. */
function safeFirst(images: string | null | undefined): string {
  if (!images) return '';
  try {
    const arr = JSON.parse(images);
    return Array.isArray(arr) && arr.length ? String(arr[0]) : '';
  } catch {
    return images;
  }
}
