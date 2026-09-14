import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';
import { toCSV, formatDate, formatPrice } from '@/lib/utils';

/** GET /api/admin/customers/export — CSV of all customers. */
export async function GET() {
  const session = await requireAdmin();
  if (!session) return new Response('Unauthorized', { status: 401 });

  const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });

  const rows = customers.map((c) => ({
    Name: c.name,
    Email: c.email,
    Phone: c.phone ?? '',
    District: c.district ?? '',
    Gender: c.gender ?? '',
    Orders: c.orderCount,
    TotalSpent: c.totalSpent,
    AvgOrderValue: c.orderCount ? Math.round(c.totalSpent / c.orderCount) : 0,
    Tags: c.tags ?? '',
    Marketing: c.acceptsMarketing ? 'yes' : 'no',
    Joined: formatDate(c.createdAt, 'long'),
  }));

  const csv = toCSV(rows);
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="bd-market-customers-${stamp}.csv"`,
    },
  });
}
