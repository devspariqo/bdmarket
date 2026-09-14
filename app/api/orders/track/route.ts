import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ORDER_STATUS_LABEL } from '@/lib/utils';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderNumber = searchParams.get('orderNumber')?.trim().toUpperCase();

  if (!orderNumber) {
    return NextResponse.json({ found: false, error: 'Order number is required' }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      orderNumber: true, status: true, total: true, createdAt: true,
      trackingNumber: true, courier: true, shipDistrict: true,
      items: { select: { productName: true, qty: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ found: false, error: 'No order found with that number' }, { status: 404 });
  }

  return NextResponse.json({
    found: true,
    order: {
      ...order,
      statusLabel: ORDER_STATUS_LABEL[order.status] || order.status,
      itemCount: order.items.reduce((s, i) => s + i.qty, 0),
    },
  });
}
