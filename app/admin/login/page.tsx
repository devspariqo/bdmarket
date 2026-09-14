import type { Metadata, Viewport } from 'next';
import AdminLoginForm from '@/components/admin/AdminLoginForm';
import { getSiteConfig } from '@/lib/settings';
import { Store } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admin Login',
  description: 'BD Market administration panel.',
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default async function AdminLoginPage() {
  const config = await getSiteConfig();

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/25">
            <Store className="h-7 w-7" strokeWidth={2.4} />
          </span>
          <h1 className="font-display text-2xl font-bold text-white">{config.siteName} Admin</h1>
          <p className="mt-1.5 text-[15px] text-ink-400">Sign in to manage your store</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-pop sm:p-7">
          <AdminLoginForm />
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
          <p className="text-[12px] font-bold uppercase tracking-wider text-ink-400">Demo Credentials</p>
          <div className="mt-2.5 space-y-1.5 font-mono text-[12px] text-ink-300">
            <p><span className="text-brand-400">Super Admin:</span> admin@bdmarket.com.bd / admin123</p>
            <p><span className="text-brand-400">Manager:</span> manager@bdmarket.com.bd / staff123</p>
            <p><span className="text-brand-400">Editor:</span> editor@bdmarket.com.bd / staff123</p>
          </div>
        </div>

        <p className="mt-5 text-center text-[12px] text-ink-500">
          © {new Date().getFullYear()} {config.siteName} · Admin Panel v1.0
        </p>
      </div>
    </div>
  );
}
