'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, Save, Truck } from 'lucide-react';
import { ORDER_STATUS_LABEL, ORDER_STATUS_FLOW, cn } from '@/lib/utils';

export default function OrderStatusUpdater({
  orderId, currentStatus, paymentStatus, trackingNumber, courier, adminNote,
}: {
  orderId: string;
  currentStatus: string;
  paymentStatus: string;
  trackingNumber: string | null;
  courier: string | null;
  adminNote: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [pay, setPay] = useState(paymentStatus);
  const [tracking, setTracking] = useState(trackingNumber || '');
  const [courierName, setCourierName] = useState(courier || '');
  const [note, setNote] = useState(adminNote);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState('');

  async function update(overrides: any = {}) {
    setSaving(true);
    setErr('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status, paymentStatus: pay, trackingNumber: tracking || null,
          courier: courierName || null, adminNote: note || null, ...overrides,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function quickStatus(s: string) {
    setStatus(s);
    await update({ status: s });
  }

  return (
    <section className="rounded-2xl border border-ink-200 bg-white p-5 no-print">
      <h2 className="mb-4 font-display text-base font-bold text-ink-900">Update Order</h2>

      {err && <p className="mb-3 rounded-lg bg-rose-50 p-2.5 text-[12px] font-semibold text-rose-700">{err}</p>}

      {/* Quick status buttons */}
      <div className="mb-4">
        <label className="label">Quick Status Change</label>
        <div className="flex flex-wrap gap-1.5">
          {ORDER_STATUS_FLOW.map((s) => (
            <button
              key={s}
              onClick={() => quickStatus(s)}
              disabled={saving}
              className={cn(
                'rounded-lg border px-2.5 py-1.5 text-[12px] font-bold transition disabled:opacity-50',
                status === s
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-ink-200 text-ink-600 hover:border-ink-900 hover:text-ink-900'
              )}
            >
              {ORDER_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3.5">
        <div>
          <label htmlFor="status" className="label">Order Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} className="select py-2 text-[13px]">
            {[...ORDER_STATUS_FLOW, 'CANCELLED', 'RETURNED', 'REFUNDED'].map((s) => (
              <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="pay" className="label">Payment Status</label>
          <select id="pay" value={pay} onChange={(e) => setPay(e.target.value)} className="select py-2 text-[13px]">
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="partial">Partially Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div>
          <label htmlFor="tracking" className="label">Tracking Number</label>
          <input
            id="tracking" value={tracking}
            onChange={(e) => setTracking(e.target.value.toUpperCase())}
            className="input py-2 font-mono text-[13px]" placeholder="BDM12345678"
          />
        </div>

        <div>
          <label htmlFor="courier" className="label">Courier</label>
          <select id="courier" value={courierName} onChange={(e) => setCourierName(e.target.value)} className="select py-2 text-[13px]">
            <option value="">— Select courier —</option>
            <option value="Pathao">Pathao</option>
            <option value="Steadfast">Steadfast</option>
            <option value="RedX">RedX</option>
            <option value="Sundarban">Sundarban Courier</option>
            <option value="SA Paribahan">SA Paribahan</option>
            <option value="Own Delivery">Own Delivery</option>
          </select>
        </div>

        <div>
          <label htmlFor="note" className="label">Admin Note</label>
          <textarea
            id="note" rows={3} value={note}
            onChange={(e) => setNote(e.target.value)}
            className="textarea min-h-[70px] text-[13px]"
            placeholder="Internal note about this order…"
          />
        </div>

        <button onClick={() => update()} disabled={saving} className="btn-primary w-full">
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
            : saved ? <><Check className="h-4 w-4" /> Updated!</>
            : <><Save className="h-4 w-4" /> Update Order</>}
        </button>
      </div>
    </section>
  );
}
