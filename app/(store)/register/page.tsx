import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/store/AuthForm';
import { getSiteConfig } from '@/lib/settings';
import { getCustomerSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Create Account',
  description: 'Create your free BD Market account — order faster, track deliveries and save your wishlist.',
};

export default async function RegisterPage() {
  const [config, session] = await Promise.all([getSiteConfig(), getCustomerSession()]);
  if (session) redirect('/account');

  return (
    <Suspense fallback={<div className="p-20 text-center text-[15px] text-ink-500">Loading…</div>}>
      <AuthForm mode="register" siteName={config.siteName} />
    </Suspense>
  );
}
