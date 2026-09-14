import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';
import { setSettings, invalidateSettingsCache, getSettingsGroup } from '@/lib/settings';

/** GET /api/admin/settings?group=general — read one group's settings. */
export async function GET(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const group = searchParams.get('group');
  if (!group) return NextResponse.json({ error: 'group is required' }, { status: 400 });

  const settings = await getSettingsGroup(group);
  return NextResponse.json({ settings });
}

/**
 * PATCH /api/admin/settings
 * Body: { group: string, values: { key: value, ... } }
 * Upserts a whole settings group in one transaction and busts the cache.
 */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.group || typeof body.values !== 'object' || body.values === null) {
    return NextResponse.json({ error: 'group and values are required' }, { status: 400 });
  }

  const { group, values, meta } = body as {
    group: string;
    values: Record<string, any>;
    meta?: Record<string, { type?: string; label?: string }>;
  };

  const entries = Object.entries(values).map(([key, raw]) => {
    const value =
      raw === null || raw === undefined
        ? ''
        : typeof raw === 'boolean'
        ? String(raw)
        : typeof raw === 'object'
        ? JSON.stringify(raw)
        : String(raw);
    return {
      key,
      value,
      group,
      type: meta?.[key]?.type,
      label: meta?.[key]?.label,
    };
  });

  if (!entries.length) return NextResponse.json({ error: 'No values provided' }, { status: 400 });

  await setSettings(entries);
  invalidateSettingsCache();

  await prisma.auditLog.create({
    data: {
      userId: session.id,
      action: 'settings.update',
      entity: 'Setting',
      entityId: group,
      meta: JSON.stringify({ keys: entries.map((e) => e.key) }),
    },
  });

  return NextResponse.json({ ok: true, updated: entries.length });
}
