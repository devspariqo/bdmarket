import type { Metadata } from 'next';
import { renderSettingsGroup } from '@/components/admin/settings/renderGroup';
import EmailDeliveryCard from '@/components/admin/settings/EmailDeliveryCard';
import { getAllSettings } from '@/lib/settings';
import { smtpFromSettings, smtpProblem } from '@/lib/email';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Email & SMTP' };

/**
 * The delivery panel comes first, above the form.
 *
 * Order matters here: the most common question about this page is "I filled it
 * in and no email arrived", and the answer is usually something the form cannot
 * show — the wrong port for the chosen encryption, a host blocking outbound
 * SMTP, or credentials the provider rejected. Seeing the resolved configuration
 * and being able to test it turns that into a one-minute check.
 */
export default async function Page() {
  const settings = await getAllSettings();
  const cfg = smtpFromSettings(settings);

  return (
    <div className="space-y-6">
      <EmailDeliveryCard
        status={settings.email_last_status || ''}
        detail={settings.email_last_detail || ''}
        at={settings.email_last_at || ''}
        problem={smtpProblem(cfg)}
        defaultTo={cfg.adminEmail}
        summary={{
          host: cfg.host,
          port: cfg.port,
          encryption: cfg.secure ? 'SSL/TLS' : cfg.requireTLS ? 'STARTTLS' : 'none',
          from: cfg.fromAddress,
          auth: !!cfg.user,
        }}
      />
      {await renderSettingsGroup('email')}
    </div>
  );
}
