import type { Metadata } from 'next';
import { renderSettingsGroup } from '@/components/admin/settings/renderGroup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Courier & Delivery' };

export default function Page() {
  return renderSettingsGroup('courier');
}
