import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';
import { toCSV, formatDate } from '@/lib/utils';

/** GET /api/admin/orders/export — download all orders (optionally filtered) as CSV. */
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const orders = await prisma.order.findMany({
    where: status && status !== 'all' ? { status } : {},
    include: { items: true },
    orderBy: { createdAt: 'desc' },
  });

  const rows = orders.map((o) => ({
    OrderNumber: o.orderNumber,
    Date: formatDate(o.createdAt, 'datetime'),
    Customer: o.customerName,
    Phone: o.phone,
    Email: o.email,
    Status: o.status,
    Payment: o.paymentMethod,
    PaymentStatus: o.paymentStatus,
    Items: o.items.reduce((s, i) => s + i.qty, 0),
    Subtotal: o.subtotal,
    Discount: o.discount,
    Shipping: o.shippingCost,
    Total: o.total,
    Division: o.shipDivision,
    District: o.shipDistrict,
    Address: `${o.shipStreet}${o.shipArea ? ', ' + o.shipArea : ''}`,
    Courier: o.courier ?? '',
    Tracking: o.trackingNumber ?? '',
    Coupon: o.couponCode ?? '',
  }));

  const csv = toCSV(rows);
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bd-market-orders-${stamp}.csv"`,
    },
  });
}
