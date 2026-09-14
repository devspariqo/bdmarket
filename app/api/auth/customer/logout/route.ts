import { NextResponse } from 'next/server';
import { destroyCustomerSession } from '@/lib/auth';

export async function POST() {
  destroyCustomerSession();
  return NextResponse.json({ ok: true });
}
