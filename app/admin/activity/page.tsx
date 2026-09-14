import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Activity, AlertCircle, FileText, Package, Settings, ShoppingCart,
  ShieldCheck, Tag, Ticket, Trash2, User, Users,
} from 'lucide-react';
import prisma from '@/lib/db';
import { formatDate, formatNumber, timeAgo } from '@/lib/utils';

export const metadata: Metadata = { title: 'Activity Log' };
export const dynamic = 'force-dynamic';

const PER_PAGE = 40;

const ENTITY_ICON: Record<string, any> = {
  Order: ShoppingCart,
  Product: Package,
  Category: Tag,
  Brand: Tag,
  Coupon: Ticket,
  Page: FileText,
  Post: FileText,
  Setting: Settings,
  User: Users,
  Customer: User,
};

const ACTION_TONE: Record<string, string> = {
  create: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  update: 'border-blue-200 bg-blue-50 text-blue-700',
  delete: 'border-rose-200 bg-rose-50 text-rose-700',
};

function actionTone(action: string) {
  const verb = action.split('.').pop() || '';
  if (verb.startsWith('create') || verb === 'login') return ACTION_TONE.create;
  if (verb.startsWith('delete')) return ACTION_TONE.delete;
  return ACTION_TONE.update;
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: { entity?: string; q?: string; page?: string };
}) {
  const entity = searchParams.entity || 'all';
  const q = searchParams.q?.trim() || '';
  const page = Math.max(1, Number(searchParams.page || 1));

  const where: any = {};
  if (entity !== 'all') where.entity = entity;
  if (q) {
    where.OR = [
      { action: { contains: q } },
      { entityId: { contains: q } },
      { user: { name: { contains: q } } },
    ];
  }

  const [logs, total, entityCounts] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.groupBy({ by: ['entity'], _count: true, orderBy: { _count: { entity: 'desc' } } }),
  ]);

  const totalAll = entityCounts.reduce((s, e) => s + e._count, 0);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const todayCount = await prisma.auditLog.count({
    where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">System</p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            Activity Log
          </h1>
          <p className="mt-1 text-[15px] text-ink-500">
            Every admin action is recorded here — who changed what, and when. Useful for auditing and team
            accountability.
          </p>
        </div>
        <div className="flex gap-1.5 text-[13px]">
          <span className="badge border border-ink-200 bg-white text-ink-600">
            {formatNumber(totalAll)} total events
          </span>
          <span className="badge border border-brand-200 bg-brand-50 text-brand-700">
            {formatNumber(todayCount)} today
          </span>
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="scroll-x flex gap-1.5 pb-1">
          <Link href="/admin/activity" className={`chip whitespace-nowrap ${entity === 'all' ? 'chip-active' : ''}`}>
            All
            <span className="rounded-full bg-black/10 px-1.5 text-[12px]">{totalAll}</span>
          </Link>
          {entityCounts.map((e) => (
            <Link
              key={e.entity}
              href={`/admin/activity?entity=${e.entity}`}
              className={`chip whitespace-nowrap ${entity === e.entity ? 'chip-active' : ''}`}
            >
              {e.entity}
              <span className="rounded-full bg-black/10 px-1.5 text-[12px]">{e._count}</span>
            </Link>
          ))}
        </div>

        <form action="/admin/activity" className="flex w-full gap-2 sm:w-auto">
          <input type="hidden" name="entity" value={entity} />
          <input name="q" defaultValue={q} placeholder="Search actions…" className="input sm:w-60" />
          <button className="btn-dark btn-sm whitespace-nowrap">Search</button>
        </form>
      </div>

      {logs.length ? (
        <div className="card overflow-hidden">
          <ol className="divide-y divide-ink-100">
            {logs.map((log) => {
              const Icon = ENTITY_ICON[log.entity] || Activity;
              let meta: any = null;
              try {
                meta = log.meta ? JSON.parse(log.meta) : null;
              } catch {
                meta = null;
              }

              return (
                <li key={log.id} className="flex items-start gap-3 p-4 transition hover:bg-ink-50/50">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-ink-100 text-ink-600">
                    <Icon className="h-4 w-4" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink-900">
                        {log.user?.name || <span className="text-ink-400">System</span>}
                      </span>
                      {log.user?.role && (
                        <span className="badge border border-ink-200 bg-white text-ink-500">{log.user.role}</span>
                      )}
                      <span className={`badge border ${actionTone(log.action)}`}>{log.action}</span>
                      <span className="badge border border-ink-200 bg-ink-50 text-ink-600">{log.entity}</span>
                    </div>

                    {log.entityId && (
                      <p className="mt-1 truncate font-mono text-[12px] text-ink-400">id: {log.entityId}</p>
                    )}

                    {meta && typeof meta === 'object' && (
                      <p className="mt-1 truncate text-[13px] text-ink-500">
                        {Object.entries(meta)
                          .slice(0, 4)
                          .map(([k, v]) => `${k}: ${Array.isArray(v) ? `${v.length} items` : String(v).slice(0, 40)}`)
                          .join(' · ')}
                      </p>
                    )}

                    <p className="mt-1 text-[12px] text-ink-400" title={formatDate(log.createdAt, 'datetime')}>
                      {log.user?.email ? `${log.user.email} · ` : ''}
                      {timeAgo(log.createdAt)}
                    </p>
                  </div>

                  <span className="hidden shrink-0 whitespace-nowrap text-[12px] text-ink-400 sm:block">
                    {formatDate(log.createdAt, 'datetime')}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <div className="card grid place-items-center py-16 text-center">
          <ShieldCheck className="h-8 w-8 text-ink-300" />
          <p className="mt-3 text-[15px] font-medium text-ink-600">No activity recorded yet.</p>
          <p className="mt-1 text-[13px] text-ink-400">Actions will appear here as your team works.</p>
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5">
          {page > 1 && (
            <Link
              href={`/admin/activity?entity=${entity}&q=${encodeURIComponent(q)}&page=${page - 1}`}
              className="btn-outline btn-sm"
            >
              Previous
            </Link>
          )}
          <span className="px-3 text-[15px] text-ink-500">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/activity?entity=${entity}&q=${encodeURIComponent(q)}&page=${page + 1}`}
              className="btn-outline btn-sm"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
