import type { Metadata } from 'next';
import { renderSettingsGroup } from '@/components/admin/settings/renderGroup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'SMS Gateway' };

export default function Page() {
  return renderSettingsGroup('sms');
}
