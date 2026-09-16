import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { notifyOrderStatus } from '@/lib/notifications';

/**
 * PATCH /api/admin/orders/[id]
 * Update an order's status / payment status / tracking / courier / notes.
 * Every status change appends an OrderEvent so the timeline stays complete.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  const { status, paymentStatus, trackingNumber, courier, adminNote, paymentRef } = body ?? {};

  const data: Record<string, any> = {};
  if (status && status !== existing.status) {
    data.status = status;
    // Stamp lifecycle timestamps
    if (status === 'CONFIRMED' && !existing.confirmedAt) data.confirmedAt = new Date();
    if (status === 'SHIPPED' && !existing.shippedAt) data.shippedAt = new Date();
    if (status === 'DELIVERED' && !existing.deliveredAt) data.deliveredAt = new Date();
  }
  if (paymentStatus) data.paymentStatus = paymentStatus;
  if (paymentRef !== undefined) data.paymentRef = paymentRef || null;
  if (trackingNumber !== undefined) data.trackingNumber = trackingNumber || null;
  if (courier !== undefined) data.courier = courier || null;
  if (adminNote !== undefined) data.adminNote = adminNote || null;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, unchanged: true });
  }

  const updated = await prisma.order.update({
    where: { id: params.id },
    data,
  });

  // Build a human-readable timeline event
  if (data.status) {
    const noteParts: string[] = [];
    if (trackingNumber) noteParts.push(`Tracking: ${trackingNumber}`);
    if (courier) noteParts.push(`Courier: ${courier}`);
    await prisma.orderEvent.create({
      data: {
        orderId: params.id,
        status: data.status,
        note: noteParts.length ? noteParts.join(' • ') : adminNote || `Status changed to ${data.status}`,
        by: session.name,
      },
    });

    // Mark COD orders as paid on delivery
    if (data.status === 'DELIVERED' && existing.paymentMethod === 'cod' && updated.paymentStatus === 'unpaid') {
      await prisma.order.update({ where: { id: params.id }, data: { paymentStatus: 'paid' } });
    }

    /**
     * Notify the customer and the store — but only on a real transition.
     *
     * Re-saving the same status is a no-op elsewhere in this handler, and
     * without the guard the customer would get a second "your order has shipped"
     * email every time someone touched the record.
     */
    if (existing.status !== data.status) {
      try {
        await notifyOrderStatus(params.id, String(data.status));
      } catch (e: any) {
        console.error('[orders] notification failed:', e?.message || e);
      }
    }
  } else if (adminNote !== undefined) {
    await prisma.orderEvent.create({
      data: { orderId: params.id, status: existing.status, note: adminNote, by: session.name },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: 'order.update',
      entity: 'Order',
      entityId: params.id,
      meta: JSON.stringify(data),
    },
  });

  return NextResponse.json({ ok: true, order: updated });
}

/** GET /api/admin/orders/[id] — fetch a single order (used by polling UIs). */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, timeline: { orderBy: { createdAt: 'desc' } }, customer: true },
  });
  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  return NextResponse.json({ order });
}

/** DELETE /api/admin/orders/[id] — only ADMIN may delete. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can delete orders' }, { status: 403 });
  }

  await prisma.order.delete({ where: { id: params.id } });
  await prisma.auditLog.create({
    data: { userId: session.id, action: 'order.delete', entity: 'Order', entityId: params.id },
  });
  return NextResponse.json({ ok: true });
}
