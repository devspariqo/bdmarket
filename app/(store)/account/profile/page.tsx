import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import prisma from '@/lib/db';
import { getCustomerSession } from '@/lib/auth';
import AccountSidebar from '@/components/store/AccountSidebar';
import ProfileForm from '@/components/store/ProfileForm';
import AvatarUpload from '@/components/store/AvatarUpload';

export const metadata: Metadata = { title: 'Profile Settings', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await getCustomerSession();
  if (!session) redirect('/login?redirect=/account/profile');

  const customer = await prisma.customer.findUnique({ where: { id: session.id } });
  if (!customer) redirect('/login');

  return (
    <div className="container-x py-8">
      <h1 className="mb-7 font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">Profile Settings</h1>

      <div className="grid gap-7 lg:grid-cols-[230px_1fr]">
        <AccountSidebar active="profile" name={customer.name} avatar={customer.avatar} />
        <div className="max-w-2xl space-y-6">
          <div className="card p-5">
            <AvatarUpload initial={customer.avatar} name={customer.name} />
          </div>

          <ProfileForm
            customer={{
              name: customer.name, email: customer.email, phone: customer.phone || '',
              gender: customer.gender || '', district: customer.district || '',
              birthday: customer.birthday ? new Date(customer.birthday).toISOString().slice(0, 10) : '',
              acceptsMarketing: customer.acceptsMarketing,
            }}
          />
        </div>
      </div>
    </div>
  );
}
