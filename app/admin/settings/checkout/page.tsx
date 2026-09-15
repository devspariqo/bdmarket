import type { Metadata } from 'next';
import { renderSettingsGroup } from '@/components/admin/settings/renderGroup';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Checkout Settings' };

export default function Page() {
  return renderSettingsGroup('checkout');
}
