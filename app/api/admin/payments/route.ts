import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * POST /api/admin/payments — create or update a payment method.
 * Gateway credentials live in `config` as a JSON string so sandbox / live
 * keys can be toggled without a schema change.
 */
export async function POST(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.code || !body?.name) {
    return NextResponse.json({ error: 'Code and name are required' }, { status: 400 });
  }

  const data = {
    code: String(body.code),
    name: String(body.name),
    nameBn: body.nameBn || null,
    description: body.description || null,
    icon: body.icon || null,
    instructions: body.instructions || null,
    isEnabled: body.isEnabled !== false,
    isSandbox: body.isSandbox !== false,
    fee: Number(body.fee || 0),
    feeType: body.feeType || 'fixed',
    config: body.config
      ? typeof body.config === 'string'
        ? body.config
        : JSON.stringify(body.config)
      : null,
    position: Number(body.position || 0),
  };

  if (body.id) {
    const method = await prisma.paymentMethod.update({ where: { id: body.id }, data });
    return NextResponse.json({ ok: true, method });
  }

  const method = await prisma.paymentMethod.upsert({
    where: { code: data.code },
    update: data,
    create: data,
  });
  return NextResponse.json({ ok: true, method });
}

/** PATCH /api/admin/payments — quick enable/disable toggle from the list view. */
export async function PATCH(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, isEnabled, isSandbox } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const data: Record<string, any> = {};
  if (isEnabled !== undefined) data.isEnabled = !!isEnabled;
  if (isSandbox !== undefined) data.isSandbox = !!isSandbox;

  const method = await prisma.paymentMethod.update({ where: { id }, data });
  return NextResponse.json({ ok: true, method });
}

/** DELETE /api/admin/payments?id=xxx */
export async function DELETE(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  await prisma.paymentMethod.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
