'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, Check, CreditCard, Loader2, Lock, Save, Settings2, Wallet, X,
} from 'lucide-react';
import { cn, formatNumber, formatPrice } from '@/lib/utils';

type Method = {
  id: string;
  code: string;
  name: string;
  nameBn: string | null;
  description: string | null;
  icon: string | null;
  instructions: string | null;
  isEnabled: boolean;
  isSandbox: boolean;
  fee: number;
  feeType: string;
  config: string | null;
  position: number;
  orderCount: number;
  volume: number;
};

const CODE_TONE: Record<string, string> = {
  cod: 'bg-amber-50 text-amber-700',
  bkash: 'bg-pink-50 text-pink-700',
  nagad: 'bg-orange-50 text-orange-700',
  rocket: 'bg-violet-50 text-violet-700',
  card: 'bg-blue-50 text-blue-700',
  sslcommerz: 'bg-emerald-50 text-emerald-700',
};

/** Credential field schema per gateway — drives the config editor UI. */
const CONFIG_FIELDS: Record<string, { key: string; label: string; secret?: boolean }[]> = {
  bkash: [
    { key: 'appKey', label: 'App Key' },
    { key: 'appSecret', label: 'App Secret', secret: true },
    { key: 'username', label: 'Merchant Username' },
    { key: 'password', label: 'Merchant Password', secret: true },
    { key: 'baseUrl', label: 'Base URL' },
  ],
  nagad: [
    { key: 'merchantId', label: 'Merchant ID' },
    { key: 'merchantKey', label: 'Merchant Private Key', secret: true },
    { key: 'baseUrl', label: 'Base URL' },
  ],
  rocket: [
    { key: 'merchantId', label: 'Merchant ID' },
    { key: 'apiKey', label: 'API Key', secret: true },
    { key: 'baseUrl', label: 'Base URL' },
  ],
  card: [
    { key: 'storeId', label: 'Store ID' },
    { key: 'storePassword', label: 'Store Password', secret: true },
    { key: 'baseUrl', label: 'Base URL' },
  ],
  sslcommerz: [
    { key: 'storeId', label: 'Store ID' },
    { key: 'storePassword', label: 'Store Password', secret: true },
    { key: 'ipnUrl', label: 'IPN URL' },
  ],
  cod: [
    { key: 'maxOrderValue', label: 'Max COD order value (৳)' },
    { key: 'advanceRequired', label: 'Advance required for remote districts (৳)' },
  ],
};

export default function PaymentMethodManager({ methods }: { methods: Method[] }) {
  const router = useRouter();
  const [list, setList] = useState(methods);
  const [busy, setBusy] = useState<string | null>(null);
  const [panel, setPanel] = useState<Method | null>(null);

  useMemo(() => setList(methods), [methods]);

  async function patch(m: Method, data: Partial<Method>) {
    setBusy(m.id);
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: m.id, ...data }),
      });
      if (!res.ok) throw new Error('Failed');
      setList((p) => p.map((x) => (x.id === m.id ? { ...x, ...data } : x)));
      router.refresh();
    } catch {
      alert('Could not update this payment method.');
    } finally {
      setBusy(null);
    }
  }

  const enabledCount = list.filter((m) => m.isEnabled).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200/70 bg-white px-4 py-3 shadow-soft">
        <p className="text-[15px] text-ink-600">
          <span className="font-semibold text-ink-900">{enabledCount}</span> of {list.length} methods visible at
          checkout
        </p>
        <div className="flex items-center gap-2 text-[13px]">
          <span className="badge border border-amber-200 bg-amber-50 text-amber-700">Sandbox mode active</span>
          <span className="text-ink-400">Switch to live keys before launch</span>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {list.map((m) => {
          const fields = CONFIG_FIELDS[m.code] || [];
          const config = safeParse(m.config);

          return (
            <div key={m.id} className="card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-xl', CODE_TONE[m.code] || 'bg-ink-100 text-ink-600')}>
                    {m.code === 'cod' ? <Wallet className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h3 className="font-display text-base font-bold text-ink-900">{m.name}</h3>
                      {m.nameBn && <span className="bn text-[13px] text-ink-400">{m.nameBn}</span>}
                    </div>
                    <p className="mt-0.5 max-w-xs text-[13px] text-ink-500">{m.description || '—'}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {m.isEnabled ? (
                        <span className="badge border border-emerald-200 bg-emerald-50 text-emerald-700">Enabled</span>
                      ) : (
                        <span className="badge border border-ink-200 bg-ink-50 text-ink-500">Disabled</span>
                      )}
                      {m.isSandbox && m.code !== 'cod' && (
                        <span className="badge border border-amber-200 bg-amber-50 text-amber-700">Sandbox</span>
                      )}
                      {m.fee > 0 && (
                        <span className="badge border border-ink-200 bg-white text-ink-600">
                          +{m.feeType === 'percent' ? `${m.fee}%` : formatPrice(m.fee)} fee
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Enable toggle */}
                <button
                  onClick={() => patch(m, { isEnabled: !m.isEnabled })}
                  disabled={busy === m.id}
                  className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition',
                    m.isEnabled ? 'bg-emerald-500' : 'bg-ink-300'
                  )}
                  aria-label={m.isEnabled ? 'Disable' : 'Enable'}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                      m.isEnabled ? 'left-[22px]' : 'left-0.5'
                    )}
                  />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-ink-100 bg-ink-50/50 p-3">
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-wide text-ink-500">Orders</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-ink-900">
                    {formatNumber(m.orderCount)}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-wide text-ink-500">Volume</p>
                  <p className="mt-0.5 font-display text-lg font-bold text-ink-900">{formatPrice(m.volume)}</p>
                </div>
              </div>

              {m.instructions && (
                <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-[13px] leading-relaxed text-blue-800">
                  {m.instructions}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => setPanel(m)} className="btn-outline btn-sm flex-1">
                  <Settings2 className="h-3.5 w-3.5" /> Configure
                </button>
                {m.code !== 'cod' && (
                  <button
                    onClick={() => patch(m, { isSandbox: !m.isSandbox })}
                    disabled={busy === m.id}
                    className={cn('btn-sm', m.isSandbox ? 'btn-outline' : 'btn-dark')}
                  >
                    {busy === m.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : m.isSandbox ? (
                      'Sandbox'
                    ) : (
                      'Live'
                    )}
                  </button>
                )}
              </div>

              {fields.length > 0 && (
                <details className="mt-3 rounded-xl border border-ink-200">
                  <summary className="cursor-pointer px-3 py-2 text-[13px] font-semibold text-ink-600">
                    Credentials {Object.keys(config).length ? `(${Object.keys(config).length} set)` : '(not set)'}
                  </summary>
                  <div className="space-y-1.5 border-t border-ink-100 p-3">
                    {fields.map((f) => {
                      const v = config[f.key];
                      return (
                        <div key={f.key} className="flex items-center justify-between gap-3 text-[13px]">
                          <span className="text-ink-500">{f.label}</span>
                          <span className="font-mono text-ink-800">
                            {v ? (f.secret ? '••••••••' : String(v)) : <span className="text-ink-300">not set</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}
            </div>
          );
        })}
      </div>

      {panel && (
        <ConfigPanel
          method={panel}
          onClose={() => setPanel(null)}
          onSaved={() => {
            setPanel(null);
            router.refresh();
          }}
        />
      )}
    </>
  );
}

function ConfigPanel({
  method,
  onClose,
  onSaved,
}: {
  method: Method;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fields = CONFIG_FIELDS[method.code] || [];
  const initial = safeParse(method.config);

  const [form, setForm] = useState({
    name: method.name,
    nameBn: method.nameBn || '',
    description: method.description || '',
    instructions: method.instructions || '',
    fee: method.fee,
    feeType: method.feeType,
    isEnabled: method.isEnabled,
    isSandbox: method.isSandbox,
  });
  const [config, setConfig] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, initial[f.key] ? String(initial[f.key]) : '']))
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  async function save() {
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, id: method.id, code: method.code, config }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-sm">
      <button className="flex-1" onClick={onClose} aria-label="Close" />
      <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-ink-900">Configure {method.name}</h2>
            <p className="text-[13px] text-ink-400">Gateway code: {method.code}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 p-5">
          {err && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-[15px] text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {err}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Display name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Name (Bangla)</label>
              <input
                value={form.nameBn}
                onChange={(e) => setForm({ ...form, nameBn: e.target.value })}
                className="input bn"
              />
            </div>
          </div>

          <div>
            <label className="label">Short description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="label">Checkout instructions</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              className="textarea"
              placeholder="Shown to the customer at checkout…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Extra fee</label>
              <input
                type="number"
                min={0}
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="label">Fee type</label>
              <select
                value={form.feeType}
                onChange={(e) => setForm({ ...form, feeType: e.target.value })}
                className="select"
              >
                <option value="fixed">Fixed (৳)</option>
                <option value="percent">Percentage (%)</option>
              </select>
            </div>
          </div>

          {fields.length > 0 && (
            <div className="rounded-xl border border-ink-200 p-3">
              <p className="flex items-center gap-1.5 text-[13px] font-bold uppercase tracking-wide text-ink-500">
                <Lock className="h-3.5 w-3.5" /> Gateway credentials
              </p>
              <div className="mt-3 space-y-3">
                {fields.map((f) => (
                  <div key={f.key}>
                    <label className="label">{f.label}</label>
                    <input
                      type={f.secret ? 'password' : 'text'}
                      value={config[f.key] || ''}
                      onChange={(e) => setConfig({ ...config, [f.key]: e.target.value })}
                      className="input font-mono text-[13px]"
                      placeholder={f.secret ? '••••••••' : ''}
                      autoComplete="off"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-ink-400">
                Credentials are stored in the local database. In production, load these from environment variables
                instead.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <ToggleRow
              label="Enabled at checkout"
              value={form.isEnabled}
              onChange={(v) => setForm({ ...form, isEnabled: v })}
            />
            {method.code !== 'cod' && (
              <ToggleRow
                label="Sandbox mode"
                hint="Use test keys — no real money moves"
                value={form.isSandbox}
                onChange={(v) => setForm({ ...form, isSandbox: v })}
              />
            )}
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-100 bg-white px-5 py-4">
          <button onClick={onClose} className="btn-outline">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save method
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition',
        value ? 'border-emerald-300 bg-emerald-50' : 'border-ink-200 bg-white'
      )}
    >
      <span>
        <span className={cn('block text-[15px] font-medium', value ? 'text-emerald-900' : 'text-ink-600')}>{label}</span>
        {hint && <span className="block text-[13px] text-ink-400">{hint}</span>}
      </span>
      <span className={cn('relative h-5 w-9 shrink-0 rounded-full transition', value ? 'bg-emerald-500' : 'bg-ink-300')}>
        <span
          className={cn(
            'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
            value ? 'left-[18px]' : 'left-0.5'
          )}
        />
      </span>
    </button>
  );
}

function safeParse(raw: string | null): Record<string, any> {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return typeof v === 'object' && v !== null ? v : {};
  } catch {
    return {};
  }
}
