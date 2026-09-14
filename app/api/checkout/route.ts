import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';
import { orderNumber } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      customerName, email, phone, division, district, area, street, postcode,
      paymentMethod = 'cod', shippingMethod, customerNote, couponCode,
    } = body;

    // Validation
    const errors: Record<string, string> = {};
    if (!customerName?.trim()) errors.customerName = 'Full name is required';
    if (!phone?.trim()) errors.phone = 'Phone number is required';
    else if (!/^(\+?880|0)?1[3-9]\d{8}$/.test(phone.replace(/[\s-]/g, '')))
      errors.phone = 'Enter a valid Bangladeshi mobile number';
    if (!email?.trim()) errors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email';
    if (!division) errors.division = 'Division is required';
    if (!district) errors.district = 'District is required';
    if (!street?.trim()) errors.street = 'Address is required';

    if (Object.keys(errors).length) {
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 });
    }

    const token = cookies().get('bdm_cart')?.value;
    if (!token) return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });

    const cart = await prisma.cart.findUnique({
      where: { token },
      include: { items: { include: { product: true } } },
    });
    if (!cart || !cart.items.length) return NextResponse.json({ error: 'Your cart is empty' }, { status: 400 });

    // Stock check
    for (const it of cart.items) {
      if (it.product.stock < it.qty) {
        return NextResponse.json(
          { error: `${it.product.name} only has ${it.product.stock} left in stock` },
          { status: 400 }
        );
      }
    }

    const subtotal = cart.items.reduce((s, i) => s + i.price * i.qty, 0);

    // Coupon
    let discount = 0;
    let appliedCoupon: string | null = null;
    const codeToUse = couponCode || cart.couponCode;
    if (codeToUse) {
      const c = await prisma.coupon.findUnique({ where: { code: codeToUse } });
      if (c && c.status === 'active' && subtotal >= c.minOrder) {
        if (c.type === 'percent') discount = (subtotal * c.value) / 100;
        else if (c.type === 'fixed') discount = c.value;
        if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
        discount = Math.min(discount, subtotal);
        appliedCoupon = c.code;
        await prisma.coupon.update({ where: { id: c.id }, data: { usedCount: { increment: 1 } } });
      }
    }

    // Shipping — resolve from zones
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
    if (zoneFreeOver > 0 && subtotal - discount >= zoneFreeOver) shippingCost = 0;
    if (appliedCoupon) {
      const c2 = await prisma.coupon.findUnique({ where: { code: appliedCoupon } });
      if (c2?.type === 'freeship') shippingCost = 0;
    }

    const total = Math.max(0, subtotal - discount + shippingCost);

    // Link or create customer
    const session = await getCustomerSession();
    let customerId = session?.id || cart.customerId || null;
    if (!customerId) {
      const existingCustomer = await prisma.customer.findUnique({ where: { email: email.toLowerCase() } });
      if (existingCustomer) customerId = existingCustomer.id;
      else {
        const created = await prisma.customer.create({
          data: {
            email: email.toLowerCase(), name: customerName, phone, district,
            addresses: { create: { fullName: customerName, phone, division, district, area, street, postcode, isDefault: true } },
          },
        });
        customerId = created.id;
      }
    }

    const order = await prisma.order.create({
      data: {
        orderNumber: orderNumber(),
        customerId,
        email: email.toLowerCase(),
        phone,
        customerName,
        status: 'PENDING',
        paymentStatus: paymentMethod === 'cod' ? 'unpaid' : 'unpaid',
        paymentMethod,
        subtotal,
        discount,
        shippingCost,
        total,
        couponCode: appliedCoupon,
        shippingMethod: shippingCost === 0 ? 'Free Delivery' : shippingMethod || 'Standard Delivery',
        shippingZone: zone?.name || 'Standard',
        shipDivision: division,
        shipDistrict: district,
        shipArea: area || '',
        shipStreet: street,
        shipPostcode: postcode || '',
        customerNote: customerNote || null,
        ipAddress: req.headers.get('x-forwarded-for') || 'local',
        userAgent: req.headers.get('user-agent') || '',
        items: {
          create: cart.items.map((it) => ({
            productId: it.productId,
            productName: it.product.name,
            variant: it.variant,
            sku: it.product.sku,
            image: safeFirst(it.product.images),
            price: it.price,
            qty: it.qty,
            total: it.price * it.qty,
          })),
        },
        timeline: {
          create: { status: 'PENDING', note: 'Order placed successfully', by: 'Customer' },
        },
      },
    });

    // Decrement stock + increment sold
    for (const it of cart.items) {
      await prisma.product.update({
        where: { id: it.productId },
        data: {
          stock: { decrement: it.qty },
          soldCount: { increment: it.qty },
        },
      });
    }

    // Update customer stats
    await prisma.customer.update({
      where: { id: customerId },
      data: { orderCount: { increment: 1 } },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null } });

    return NextResponse.json({
      ok: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      total: order.total,
      paymentMethod,
      redirect: paymentMethod === 'cod' ? `/order/${order.orderNumber}` : `/order/${order.orderNumber}?pay=${paymentMethod}`,
    });
  } catch (e) {
    console.error('checkout', e);
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 });
  }
}

function safeFirst(images: string) {
  try {
    const a = JSON.parse(images);
    return Array.isArray(a) ? a[0] || '' : '';
  } catch {
    return '';
  }
}
