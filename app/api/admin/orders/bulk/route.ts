import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { notifyOrderStatus } from '@/lib/notifications';

/**
 * POST /api/admin/orders/bulk
 * Body: { ids: string[], action: 'status' | 'payment' | 'delete', status?, paymentStatus? }
 * Bulk update statuses on many orders at once — used by the orders list table.
 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ids, action, status, paymentStatus } = await req.json().catch(() => ({}));
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'No orders selected' }, { status: 400 });
  }

  if (action === 'delete') {
    if (session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete orders' }, { status: 403 });
    }
    const { count } = await prisma.order.deleteMany({ where: { id: { in: ids } } });
    await prisma.auditLog.create({
      data: { userId: session.id, action: 'order.bulk-delete', entity: 'Order', meta: JSON.stringify({ ids }) },
    });
    return NextResponse.json({ ok: true, count });
  }

  if (action === 'status' && status) {
    await prisma.order.updateMany({ where: { id: { in: ids } }, data: { status } });
    await prisma.orderEvent.createMany({
      data: ids.map((id) => ({ orderId: id, status, note: `Bulk update to ${status}`, by: session.name })),
    });
    await prisma.auditLog.create({
      data: { userId: session.id, action: 'order.bulk-status', entity: 'Order', meta: JSON.stringify({ ids, status }) },
    });

    /**
     * Notify after the update, deliberately without awaiting.
     *
     * A bulk action can cover dozens of orders and each notification is a mail
     * round trip; awaiting them would time the request out. `notifyOrderStatus`
     * bounds each attempt with its own deadline and writes the outcome to that
     * order's timeline, so a failure is still visible on the order.
     */
    void Promise.allSettled(ids.map((id) => notifyOrderStatus(id, status)));

    return NextResponse.json({ ok: true, count: ids.length });
  }

  if (action === 'payment' && paymentStatus) {
    await prisma.order.updateMany({ where: { id: { in: ids } }, data: { paymentStatus } });
    return NextResponse.json({ ok: true, count: ids.length });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
