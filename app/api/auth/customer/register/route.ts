import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, createCustomerSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const emailNorm = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Try signing in.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email: emailNorm, passwordHash, name: name.trim(), phone: phone || null, role: 'CUSTOMER' },
    });

    const customer = await prisma.customer.create({
      data: { userId: user.id, email: emailNorm, name: name.trim(), phone: phone || null },
    });

    await createCustomerSession(customer.id, emailNorm, name.trim());

    return NextResponse.json({ ok: true, user: { id: customer.id, name: name.trim(), email: emailNorm } });
  } catch (e) {
    console.error('register', e);
    return NextResponse.json({ error: 'Could not create your account. Please try again.' }, { status: 500 });
  }
}
