import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import AuthForm from '@/components/store/AuthForm';
import { getSiteConfig } from '@/lib/settings';
import { getCustomerSession } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your BD Market account to track orders, manage your wishlist and check out faster.',
  robots: { index: true, follow: true },
};

export default async function LoginPage() {
  const [config, session] = await Promise.all([getSiteConfig(), getCustomerSession()]);
  if (session) redirect('/account');

  return (
    <Suspense fallback={<div className="p-20 text-center text-[15px] text-ink-500">Loading…</div>}>
      <AuthForm mode="login" siteName={config.siteName} />
    </Suspense>
  );
}
