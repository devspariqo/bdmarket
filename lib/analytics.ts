import prisma from './db';

// ─── Analytics aggregation helpers for the admin dashboard ───

export function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function daysAgo(n: number) {
  const x = startOfDay();
  x.setDate(x.getDate() - n);
  return x;
}

export const REVENUE_STATUSES = ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];

export async function dashboardStats() {
  const today = startOfDay();
  const yesterday = daysAgo(1);
  const last30 = daysAgo(30);
  const last60 = daysAgo(60);

  const [
    totalOrders, todayOrders, yesterdayOrders, pendingOrders,
    totalProducts, lowStockProducts, outOfStock, publishedProducts,
    totalCustomers, newCustomers30,
    allOrders30, prevOrders30,
    totalRevenueAgg, revenue30Agg, revenuePrev30Agg,
    pendingReviews, totalReviews,
    unitsSoldAgg, totalCustomersForConversion,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.order.count({ where: { status: { in: ['PENDING', 'PROCESSING', 'CONFIRMED', 'PACKED'] } } }),
    prisma.product.count(),
    prisma.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
    prisma.product.count({ where: { stock: { lte: 0 } } }),
    prisma.product.count({ where: { status: 'published' } }),
    prisma.customer.count(),
    prisma.customer.count({ where: { createdAt: { gte: last30 } } }),
    prisma.order.findMany({ where: { createdAt: { gte: last30 } }, select: { total: true, status: true, createdAt: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: last60, lt: last30 } }, select: { total: true, status: true } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: REVENUE_STATUSES } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: last30 } } }),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: REVENUE_STATUSES }, createdAt: { gte: last60, lt: last30 } } }),
    prisma.review.count({ where: { status: 'pending' } }),
    prisma.review.count(),
    prisma.orderItem.aggregate({ _sum: { qty: true } }),
    prisma.customer.count(),
  ]);

  const rev30 = revenue30Agg._sum.total || 0;
  const revPrev30 = revenuePrev30Agg._sum.total || 0;
  const revGrowth = revPrev30 > 0 ? ((rev30 - revPrev30) / revPrev30) * 100 : rev30 > 0 ? 100 : 0;
  const ordGrowth =
    prevOrders30.length > 0
      ? ((allOrders30.length - prevOrders30.length) / prevOrders30.length) * 100
      : allOrders30.length > 0
      ? 100
      : 0;

  const revenueOrders30 = allOrders30.filter((o) => REVENUE_STATUSES.includes(o.status));
  const aov = revenueOrders30.length ? rev30 / revenueOrders30.length : 0;
  const conversionRate = totalCustomersForConversion ? (totalOrders / totalCustomersForConversion) * 100 : 0;

  return {
    // orders
    totalOrders,
    todayOrders,
    yesterdayOrders,
    pendingOrders,
    // catalogue
    totalProducts,
    publishedProducts,
    lowStock: lowStockProducts,
    lowStockProducts,
    outOfStock,
    unitsSold: unitsSoldAgg._sum.qty || 0,
    // customers
    totalCustomers,
    newCustomers30,
    // revenue
    totalRevenue: totalRevenueAgg._sum.total || 0,
    revenue30: rev30,
    revGrowth,
    ordGrowth,
    aov,
    conversionRate,
    conversion: conversionRate,
    // reviews
    pendingReviews,
    totalReviews,
  };
}

export async function revenueSeries(days = 30) {
  const from = daysAgo(days - 1);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from } },
    select: { total: true, createdAt: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  const buckets: Record<string, { date: string; revenue: number; orders: number }> = {};
  for (let i = 0; i < days; i++) {
    const d = daysAgo(days - 1 - i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = { date: key, revenue: 0, orders: 0 };
  }
  for (const o of orders) {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    if (buckets[key]) {
      buckets[key].orders += 1;
      if (REVENUE_STATUSES.includes(o.status)) buckets[key].revenue += o.total;
    }
  }
  return Object.values(buckets);
}

export async function statusBreakdown() {
  const rows = await prisma.order.groupBy({ by: ['status'], _count: { _all: true } });
  return rows.map((r) => ({ status: r.status, count: r._count._all, value: r._count._all }));
}

export async function paymentBreakdown() {
  const rows = await prisma.order.groupBy({ by: ['paymentMethod'], _count: { _all: true }, _sum: { total: true } });
  return rows.map((r) => ({ method: r.paymentMethod, count: r._count._all, total: r._sum.total || 0 }));
}

export async function topProducts(limit = 8) {
  const items = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { qty: true, total: true },
    orderBy: { _sum: { qty: 'desc' } },
    take: limit,
  });
  const ids = items.map((i) => i.productId).filter(Boolean) as string[];
  const products = await prisma.product.findMany({ where: { id: { in: ids } } });
  const map = new Map(products.map((p) => [p.id, p]));
  return items
    .map((i) => {
      const p = i.productId ? map.get(i.productId) : null;
      return {
        id: i.productId as string,
        name: p?.name || 'Deleted product',
        image: p ? safeImage(p.images) : '',
        slug: p?.slug || '',
        stock: p?.stock ?? 0,
        sold: i._sum.qty || 0,
        qty: i._sum.qty || 0,
        revenue: i._sum.total || 0,
      };
    })
    .filter((i) => i.id);
}

export async function topCategories(limit = 6) {
  const products = await prisma.product.findMany({
    select: { categoryId: true, soldCount: true, price: true, category: { select: { name: true, slug: true } } },
  });
  const agg: Record<string, { name: string; slug: string; sold: number; revenue: number }> = {};
  for (const p of products) {
    const key = p.categoryId || 'uncategorized';
    if (!agg[key]) agg[key] = { name: p.category?.name || 'Uncategorized', slug: p.category?.slug || '', sold: 0, revenue: 0 };
    agg[key].sold += p.soldCount;
    agg[key].revenue += p.soldCount * p.price;
  }
  return Object.entries(agg)
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export async function recentOrders(limit = 8) {
  return prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true, orderNumber: true, customerName: true, total: true,
      status: true, paymentMethod: true, paymentStatus: true, createdAt: true,
    },
  });
}

export async function lowStockList(limit = 8) {
  return prisma.product.findMany({
    where: { stock: { lte: 10 } },
    orderBy: { stock: 'asc' },
    take: limit,
    select: { id: true, name: true, sku: true, stock: true, images: true, slug: true },
  });
}

export async function topDistricts(limit = 6) {
  const rows = await prisma.order.groupBy({
    by: ['shipDistrict'],
    _count: { _all: true },
    _sum: { total: true },
    orderBy: { _count: { shipDistrict: 'desc' } },
    take: limit,
  });
  return rows.map((r) => ({ district: r.shipDistrict, orders: r._count._all, revenue: r._sum.total || 0 }));
}

function safeImage(images: string) {
  try {
    const a = JSON.parse(images);
    return Array.isArray(a) ? a[0] || '' : '';
  } catch {
    return '';
  }
}
