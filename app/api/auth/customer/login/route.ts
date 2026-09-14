import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword, createCustomerSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return NextResponse.json({ error: 'No account found with that email address' }, { status: 401 });
    }
    if (user.status !== 'active') {
      return NextResponse.json({ error: 'This account has been suspended. Contact support.' }, { status: 403 });
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 401 });
    }

    // Ensure a Customer record exists
    let customer = await prisma.customer.findUnique({ where: { userId: user.id } });
    if (!customer) {
      customer = await prisma.customer.upsert({
        where: { email: user.email },
        update: { userId: user.id },
        create: { userId: user.id, email: user.email, name: user.name, phone: user.phone },
      });
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createCustomerSession(customer.id, user.email, user.name);

    // Attach any existing guest cart
    // (handled client-side via router.refresh + cookie persistence)

    return NextResponse.json({
      ok: true,
      user: { id: customer.id, name: user.name, email: user.email },
      isAdmin: ['ADMIN', 'MANAGER', 'EDITOR'].includes(user.role),
    });
  } catch (e) {
    console.error('login', e);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
