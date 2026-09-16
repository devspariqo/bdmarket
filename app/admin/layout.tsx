import type { Metadata, Viewport } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import AdminShell from '@/components/admin/AdminShell';
import { getSession } from '@/lib/auth';
import { getSiteConfig } from '@/lib/settings';
import prisma from '@/lib/db';

export const metadata: Metadata = {
  title: { default: 'Dashboard', template: '%s | BD Market Admin' },
  description: 'BD Market administration panel.',
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';

  // Login page renders standalone
  if (pathname.includes('/admin/login')) {
    return <>{children}</>;
  }

  const session = await getSession();
  if (!session || !['ADMIN', 'MANAGER', 'EDITOR'].includes(session.role)) {
    redirect('/admin/login');
  }

  const [config, pendingOrders, pendingReviews, lowStock, account] = await Promise.all([
    getSiteConfig(),
    prisma.order.count({ where: { status: { in: ['PENDING', 'PROCESSING'] } } }),
    prisma.review.count({ where: { status: 'pending' } }),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
    // The avatar lives in the database, not the JWT, so a freshly uploaded photo
    // shows up without the user having to sign out and back in.
    prisma.user.findUnique({ where: { id: session.id }, select: { avatar: true } }),
  ]);

  return (
    <AdminShell
      user={{ name: session.name, email: session.email, role: session.role, avatar: account?.avatar ?? null }}
      config={{ siteName: config.siteName, logo: config.logo }}
      badges={{ orders: pendingOrders, reviews: pendingReviews, stock: lowStock }}
    >
      {children}
    </AdminShell>
  );
}
