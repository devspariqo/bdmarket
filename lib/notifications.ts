import prisma from '@/lib/db';
import { getSiteConfig } from '@/lib/settings';
import { sendMail, emailShell, escapeHtml, smtpFromSettings, type SendResult } from '@/lib/email';
import { sendSms, smsFromSettings } from '@/lib/sms';
import { getAllSettings } from '@/lib/settings';
import { formatPrice } from '@/lib/utils';

/**
 * Order notifications to the customer and to the store.
 *
 * Called from the checkout route and from the admin's status updates. Two rules
 * shape everything here:
 *
 *  1. **Never break the order.** A notification failure is logged and reported,
 *     never thrown. The order is already in the database by this point.
 *  2. **Never hang the request.** Four sends run in parallel behind an overall
 *     deadline, because a mail server that accepts the connection and then goes
 *     quiet would otherwise hold the checkout open until the platform kills it.
 */

export type NotificationSummary = {
  email: { customer: SendResult | null; admin: SendResult | null };
  sms: { customer: SendResult | null; admin: SendResult | null };
};

/** Overall budget for all notifications on one event. */
const DEADLINE_MS = 12_000;

function withDeadline<T>(p: Promise<T>, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), DEADLINE_MS)),
  ]);
}

/** "BDM-1234 · 2 items · ৳3,450" */
function orderHeadline(order: any) {
  const count = (order.items || []).reduce((n: number, i: any) => n + i.qty, 0);
  return `#${order.orderNumber} · ${count} item${count === 1 ? '' : 's'} · ${formatPrice(order.total)}`;
}

function itemRows(items: any[]) {
  return items
    .map(
      (i) => `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px">
        ${escapeHtml(i.productName)}${i.variant ? ` <span style="color:#78716c">(${escapeHtml(i.variant)})</span>` : ''}
        <span style="color:#78716c"> × ${i.qty}</span>
      </td>
      <td style="padding:8px 0;border-bottom:1px solid #f0efee;font-size:14px;text-align:right;white-space:nowrap">
        ${formatPrice(i.total)}
      </td>
    </tr>`
    )
    .join('');
}

function totalsBlock(order: any) {
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:3px 0;font-size:14px;color:${strong ? '#1c1917' : '#57534e'};${strong ? 'font-weight:700' : ''}">${label}</td>
     <td style="padding:3px 0;font-size:14px;text-align:right;${strong ? 'font-weight:700' : ''}">${value}</td></tr>`;

  return `<table style="width:100%;border-collapse:collapse;margin-top:12px">
    ${row('Subtotal', formatPrice(order.subtotal))}
    ${order.discount ? row('Discount', '−' + formatPrice(order.discount)) : ''}
    ${row('Delivery', order.shippingCost ? formatPrice(order.shippingCost) : 'Free')}
    ${row('Total', formatPrice(order.total), true)}
  </table>`;
}

function addressBlock(order: any) {
  const lines = [
    order.shipStreet,
    order.shipArea,
    order.shipDistrict,
    order.shipDivision,
    order.shipPostcode,
  ].filter(Boolean);
  return `<p style="margin:0;font-size:14px;line-height:1.6;color:#57534e">
    ${escapeHtml(order.customerName)}<br>
    ${escapeHtml(order.phone)}${order.email ? `<br>${escapeHtml(order.email)}` : ''}<br>
    ${lines.map(escapeHtml).join('<br>')}
  </p>`;
}

function paragraph(text: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#44403c">${text}</p>`;
}

/**
 * Send every configured notification for one event.
 *
 * `event` decides which messages go out and whether the SMS templates apply.
 */
async function dispatch(order: any, event: 'placed' | 'shipped' | 'delivered' | 'cancelled') {
  const settings = await getAllSettings();
  const emailCfg = smtpFromSettings(settings);
  const smsCfg = smsFromSettings(settings);
  const config = await getSiteConfig();

  const storeName = config.siteName || 'Our store';
  const trackingUrl = config.siteUrl ? `${config.siteUrl.replace(/\/$/, '')}/order/${order.orderNumber}` : '';
  const summary: NotificationSummary = { email: { customer: null, admin: null }, sms: { customer: null, admin: null } };

  const jobs: Promise<void>[] = [];

  // ── Email ──
  const wantsEmail =
    event === 'placed' ? settings.email_order_confirm !== 'false' : settings.email_order_shipped !== 'false';

  if (emailCfg.enabled && wantsEmail) {
    if (emailCfg.notifyCustomer && order.email) {
      const heading =
        event === 'placed'
          ? `Thanks — your order is confirmed`
          : event === 'shipped'
          ? `Your order is on its way`
          : event === 'delivered'
          ? `Your order has been delivered`
          : `Your order has been cancelled`;

      const intro =
        event === 'placed'
          ? paragraph(
              `We have received your order <strong>#${escapeHtml(order.orderNumber)}</strong>. ` +
                `Our team will call you to confirm before dispatch.`
            )
          : event === 'shipped'
          ? paragraph(
              `Order <strong>#${escapeHtml(order.orderNumber)}</strong> has left our warehouse. ` +
                `Please keep your phone nearby — the courier will call before delivery.`
            )
          : event === 'delivered'
          ? paragraph(`Order <strong>#${escapeHtml(order.orderNumber)}</strong> has been delivered. Thank you for shopping with us.`)
          : paragraph(`Order <strong>#${escapeHtml(order.orderNumber)}</strong> has been cancelled. If this is unexpected, reply to this email.`);

      const html = emailShell({
        storeName,
        heading,
        footerText: emailCfg.footerText,
        body: `${intro}
          <table style="width:100%;border-collapse:collapse">${itemRows(order.items || [])}</table>
          ${totalsBlock(order)}
          <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0efee">
            <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#78716c">Delivery address</p>
            ${addressBlock(order)}
          </div>
          ${trackingUrl ? `<p style="margin:20px 0 0;font-size:14px"><a href="${trackingUrl}" style="color:#0f766e">Track this order</a></p>` : ''}`,
      });

      jobs.push(
        sendMail({ to: order.email, subject: `${storeName} — order #${order.orderNumber}`, html }).then((r) => {
          summary.email.customer = r;
        })
      );
    }

    if (emailCfg.notifyAdmin && emailCfg.adminEmail) {
      const html = emailShell({
        storeName,
        heading:
          event === 'placed'
            ? `New order ${orderHeadline(order)}`
            : `Order ${order.orderNumber} — ${event}`,
        footerText: emailCfg.footerText,
        body: `${paragraph(
          `<strong>${escapeHtml(order.customerName)}</strong> · ${escapeHtml(order.phone)}` +
            `${order.email ? ` · ${escapeHtml(order.email)}` : ''}<br>` +
            `Payment: <strong>${escapeHtml(String(order.paymentMethod || '').toUpperCase())}</strong> · ` +
            `Zone: ${escapeHtml(order.shippingZone || '—')}` +
            `${order.customerNote ? `<br><em>Note: ${escapeHtml(order.customerNote)}</em>` : ''}`
        )}
        <table style="width:100%;border-collapse:collapse">${itemRows(order.items || [])}</table>
        ${totalsBlock(order)}
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0efee">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#78716c">Ship to</p>
          ${addressBlock(order)}
        </div>`,
      });

      jobs.push(
        sendMail({ to: emailCfg.adminEmail, subject: `New order #${order.orderNumber} — ${formatPrice(order.total)}`, html }).then(
          (r) => {
            summary.email.admin = r;
          }
        )
      );
    }
  }

  // ── SMS ──
  const smsAllowed =
    event === 'placed'
      ? settings.sms_order_confirm !== 'false'
      : event === 'shipped'
      ? settings.sms_order_shipped !== 'false'
      : event === 'delivered'
      ? settings.sms_order_delivered !== 'false'
      : false;

  if (smsCfg.enabled && smsAllowed) {
    const customerText =
      event === 'placed'
        ? `${storeName}: order #${order.orderNumber} confirmed. Total ${formatPrice(order.total)}. We will call you shortly.`
        : event === 'shipped'
        ? `${storeName}: order #${order.orderNumber} is on the way. The courier will call before delivery.`
        : `${storeName}: order #${order.orderNumber} delivered. Thank you!`;

    if (smsCfg.notifyCustomer && order.phone) {
      jobs.push(sendSms(order.phone, customerText).then((r) => { summary.sms.customer = r; }));
    }
    if (smsCfg.notifyAdmin && smsCfg.adminPhone) {
      jobs.push(
        sendSms(smsCfg.adminPhone, `New order #${order.orderNumber} — ${formatPrice(order.total)} — ${order.customerName}, ${order.phone}`).then(
          (r) => { summary.sms.admin = r; }
        )
      );
    }
  }

  await withDeadline(Promise.allSettled(jobs).then(() => undefined), undefined);
  return summary;
}

/**
 * Fire the notifications for a new order.
 *
 * Wrapped by the caller in a try/catch as well: an order that reached the
 * database must never be reported as a failure because a mail server was down.
 */
export async function notifyOrderPlaced(orderId: string): Promise<NotificationSummary | null> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return null;
    const summary = await dispatch(order, 'placed');
    await logOutcome(order.id, summary);
    return summary;
  } catch (e: any) {
    console.error('[notifications] order placed failed:', e?.message || e);
    return null;
  }
}

/** Notify on an admin status change. `status` is the order's new status. */
export async function notifyOrderStatus(orderId: string, status: string): Promise<NotificationSummary | null> {
  const s = String(status || '').toUpperCase();
  const event: 'shipped' | 'delivered' | 'cancelled' | null =
    s === 'SHIPPED' ? 'shipped' : s === 'DELIVERED' ? 'delivered' : s === 'CANCELLED' ? 'cancelled' : null;
  if (!event) return null;

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) return null;
    const summary = await dispatch(order, event);
    await logOutcome(order.id, summary);
    return summary;
  } catch (e: any) {
    console.error('[notifications] status change failed:', e?.message || e);
    return null;
  }
}

/**
 * Record what happened on the order's timeline.
 *
 * The merchant sees the order timeline in the admin, so a failed notification
 * shows up next to the order it belongs to rather than only in a server log they
 * may not have access to.
 */
async function logOutcome(orderId: string, summary: NotificationSummary) {
  const parts: string[] = [];
  const note = (label: string, r: SendResult | null) => {
    if (!r) return;
    parts.push(r.ok ? `${label} sent` : `${label} failed — ${r.error}`);
  };
  note('customer email', summary.email.customer);
  note('store email', summary.email.admin);
  note('customer SMS', summary.sms.customer);
  note('store SMS', summary.sms.admin);

  if (!parts.length) return;

  try {
    await prisma.orderEvent.create({
      data: {
        orderId,
        status: 'NOTIFICATION',
        note: parts.join(' · ').slice(0, 900),
        by: 'System',
      },
    });
  } catch (e: any) {
    console.warn('[notifications] could not write the timeline entry:', e?.message || e);
  }
}
