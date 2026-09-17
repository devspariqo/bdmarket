import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';
import { getAdminBase } from '@/lib/admin-path';

export async function POST() {
  destroySession();
  // The login page lives at the configured panel path, not always /admin.
  return NextResponse.json({ ok: true, redirect: `${await getAdminBase()}/login` });
}
