import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

/** GET /api/admin/search?q=term — global admin search (products, orders, customers). */
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = new URL(req.url).searchParams.get('q')?.trim() || '';
  if (q.length < 2) return NextResponse.json({ results: [] });

  const [products, orders, customers] = await Promise.all([
    prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q } },
          { sku: { contains: q } },
          { nameBn: { contains: q } },
        ],
      },
      select: { id: true, name: true, sku: true, price: true, images: true },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        OR: [
          { orderNumber: { contains: q } },
          { customerName: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      select: { id: true, orderNumber: true, customerName: true, total: true, status: true },
      take: 5,
    }),
    prisma.customer.findMany({
      where: {
        OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }],
      },
      select: { id: true, name: true, email: true, phone: true },
      take: 5,
    }),
  ]);

  const results = [
    ...products.map((p) => ({
      type: 'product' as const,
      id: p.id,
      title: p.name,
      subtitle: p.sku,
      href: `/admin/products/${p.id}`,
    })),
    ...orders.map((o) => ({
      type: 'order' as const,
      id: o.id,
      title: o.orderNumber,
      subtitle: `${o.customerName} • ${o.status}`,
      href: `/admin/orders/${o.id}`,
    })),
    ...customers.map((c) => ({
      type: 'customer' as const,
      id: c.id,
      title: c.name,
      subtitle: c.email,
      href: `/admin/customers?q=${encodeURIComponent(c.email)}`,
    })),
  ];

  return NextResponse.json({ results });
}
