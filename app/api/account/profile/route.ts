import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';

export async function PATCH(req: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  try {
    const body = await req.json();
    const data: any = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.phone !== undefined) data.phone = String(body.phone).trim() || null;
    if (body.gender !== undefined) data.gender = body.gender || null;
    if (body.district !== undefined) data.district = body.district || null;
    if (body.birthday !== undefined) data.birthday = body.birthday ? new Date(body.birthday) : null;
    if (body.acceptsMarketing !== undefined) data.acceptsMarketing = !!body.acceptsMarketing;

    const updated = await prisma.customer.update({ where: { id: session.id }, data });
    await prisma.user.updateMany({ where: { email: session.email }, data: { name: data.name, phone: data.phone } });

    return NextResponse.json({ ok: true, customer: { name: updated.name } });
  } catch (e) {
    console.error('profile update', e);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
