import type { Metadata } from 'next';
import { Shield, ShieldCheck, UserCog, Users } from 'lucide-react';
import prisma from '@/lib/db';
import { formatDate, formatNumber } from '@/lib/utils';
import { getSession } from '@/lib/auth';
import UserManager from '@/components/admin/UserManager';

export const metadata: Metadata = { title: 'Admin Users' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const session = await getSession();
  const users = await prisma.user.findMany({
    orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, name: true, email: true, phone: true, role: true,
      status: true, avatar: true, lastLoginAt: true, createdAt: true,
      _count: { select: { auditLogs: true } },
    },
  });

  const admins = users.filter((u) => u.role === 'ADMIN').length;
  const managers = users.filter((u) => u.role === 'MANAGER').length;
  const editors = users.filter((u) => u.role === 'EDITOR').length;

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow">System</p>
        <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Admin Users</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Team accounts with role-based access. Admins get full control; managers run daily operations; editors handle
          content only.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total users" value={formatNumber(users.length)} icon={Users} tone="bg-brand-50 text-brand-700" />
        <Stat label="Admins" value={formatNumber(admins)} icon={ShieldCheck} tone="bg-rose-50 text-rose-600" />
        <Stat label="Managers" value={formatNumber(managers)} icon={UserCog} tone="bg-blue-50 text-blue-700" />
        <Stat label="Editors" value={formatNumber(editors)} icon={Shield} tone="bg-amber-50 text-amber-700" />
      </div>

      {/* Role reference */}
      <div className="card p-5">
        <h2 className="font-display text-[15px] font-bold text-ink-900">Role permissions</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            {
              role: 'ADMIN',
              tone: 'border-rose-200 bg-rose-50',
              can: ['Everything, including deleting orders & customers', 'Manage admin users', 'Change all settings'],
            },
            {
              role: 'MANAGER',
              tone: 'border-blue-200 bg-blue-50',
              can: ['Products, orders, customers', 'Coupons & shipping zones', 'Settings (except advanced)'],
            },
            {
              role: 'EDITOR',
              tone: 'border-amber-200 bg-amber-50',
              can: ['Products & categories', 'Blog posts & CMS pages', 'Media library & banners'],
            },
          ].map((r) => (
            <div key={r.role} className={`rounded-xl border p-3.5 ${r.tone}`}>
              <p className="font-display text-[15px] font-bold text-ink-900">{r.role}</p>
              <ul className="mt-2 space-y-1">
                {r.can.map((c) => (
                  <li key={c} className="flex gap-1.5 text-[13px] leading-relaxed text-ink-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <UserManager
        currentUserId={session?.id || ''}
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          status: u.status,
          avatar: u.avatar,
          lastLoginAt: u.lastLoginAt ? formatDate(u.lastLoginAt, 'datetime') : null,
          createdAt: formatDate(u.createdAt),
          activityCount: u._count.auditLogs,
        }))}
      />
    </div>
  );
}

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: any; tone: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{value}</p>
        </div>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
