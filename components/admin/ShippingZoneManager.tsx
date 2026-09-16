'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, Check, Loader2, MapPin, Pencil, Plus, Save, Settings2, Trash2, Truck, X,
} from 'lucide-react';
import { cn, formatPrice, BD_DISTRICTS } from '@/lib/utils';

type Zone = {
  id: string;
  name: string;
  districts: string;
  method: string;
  rate: number;
  freeOver: number | null;
  minDays: number;
  maxDays: number;
  codEnabled: boolean;
  status: string;
  position: number;
};

type S = { key: string; value: string; label: string | null; type: string };

const EMPTY = {
  id: '',
  name: '',
  districts: '',
  method: 'flat',
  rate: 80,
  freeOver: 2000 as string | number,
  minDays: 1,
  maxDays: 3,
  codEnabled: true,
  status: 'active',
  position: 0,
};

const METHOD_LABEL: Record<string, string> = {
  flat: 'Flat rate',
  free: 'Free shipping',
  weight: 'By weight',
  freeship_over: 'Free over amount',
};

const ALL_DISTRICTS = Object.values(BD_DISTRICTS).flat();

export default function ShippingZoneManager({ zones, settings }: { zones: Zone[]; settings: S[] }) {
  const router = useRouter();
  const [list, setList] = useState(zones);
  const [tab, setTab] = useState<'zones' | 'defaults'>('zones');
  const [panel, setPanel] = useState<null | typeof EMPTY>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const [defaults, setDefaults] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [defaultsSaved, setDefaultsSaved] = useState(false);

  useEffect(() => setList(zones), [zones]);
  useEffect(() => {
    setDefaults(Object.fromEntries(settings.map((s) => [s.key, s.value])));
  }, [settings]);

  // Districts already claimed by another zone
  const claimed = useMemo(() => {
    const set = new Set<string>();
    for (const z of list) {
      if (panel && z.id === panel.id) continue;
      z.districts.split(',').map((d) => d.trim()).filter(Boolean).forEach((d) => set.add(d));
    }
    return set;
  }, [list, panel]);

  function openNew() {
    setErr('');
    setPanel({ ...EMPTY, position: list.length });
  }

  function openEdit(z: Zone) {
    setErr('');
    setPanel({
      id: z.id,
      name: z.name,
      districts: z.districts,
      method: z.method,
      rate: z.rate,
      freeOver: z.freeOver ?? '',
      minDays: z.minDays,
      maxDays: z.maxDays,
      codEnabled: z.codEnabled,
      status: z.status,
      position: z.position,
    });
  }

  async function save() {
    if (!panel) return;
    if (!panel.name.trim()) return setErr('Zone name is required');
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...panel,
          id: panel.id || undefined,
          freeOver: panel.freeOver === '' ? null : Number(panel.freeOver),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setPanel(null);
      router.refresh();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this shipping zone? Districts will fall back to the default rate.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/shipping?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      setList((p) => p.filter((z) => z.id !== id));
      router.refresh();
    } catch {
      alert('Could not delete this zone.');
    } finally {
      setDeleting(null);
    }
  }

  async function saveDefaults() {
    setSavingDefaults(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          group: 'shipping',
          values: defaults,
          meta: Object.fromEntries(settings.map((s) => [s.key, { type: s.type, label: s.label }])),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setDefaultsSaved(true);
      setTimeout(() => setDefaultsSaved(false), 2500);
      router.refresh();
    } catch {
      alert('Could not save shipping defaults.');
    } finally {
      setSavingDefaults(false);
    }
  }

  function toggleDistrict(d: string) {
    if (!panel) return;
    const cur = panel.districts.split(',').map((x) => x.trim()).filter(Boolean);
    if (panel.districts === 'ALL') return;
    const next = cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d];
    setPanel({ ...panel, districts: next.join(', ') });
  }

  const selected = panel ? panel.districts.split(',').map((d) => d.trim()).filter(Boolean) : [];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          <button onClick={() => setTab('zones')} className={cn('chip', tab === 'zones' && 'chip-active')}>
            <Truck className="h-3.5 w-3.5" /> Zones
          </button>
          <button onClick={() => setTab('defaults')} className={cn('chip', tab === 'defaults' && 'chip-active')}>
            <Settings2 className="h-3.5 w-3.5" /> Default rules
          </button>
        </div>
        {tab === 'zones' && (
          <button onClick={openNew} className="btn-primary">
            <Plus className="h-4 w-4" /> New zone
          </button>
        )}
      </div>

      {tab === 'zones' ? (
        list.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {list.map((z) => {
              const districts = z.districts.split(',').map((d) => d.trim()).filter(Boolean);
              const all = z.districts === 'ALL';
              return (
                <div key={z.id} className="card flex flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                        <Truck className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="font-semibold text-ink-900">{z.name}</h3>
                        <p className="text-[13px] text-ink-400">
                          {METHOD_LABEL[z.method] || z.method} • {z.minDays}–{z.maxDays} days
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'badge border',
                        z.status === 'active'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-ink-200 bg-ink-50 text-ink-500'
                      )}
                    >
                      {z.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-bold text-ink-900">
                      {z.method === 'free' ? 'Free' : formatPrice(z.rate)}
                    </span>
                    {z.freeOver && (
                      <span className="text-[13px] text-ink-400">free over {formatPrice(z.freeOver)}</span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-1.5">
                    {z.codEnabled ? (
                      <span className="badge border border-blue-200 bg-blue-50 text-blue-700">COD enabled</span>
                    ) : (
                      <span className="badge border border-ink-200 bg-ink-50 text-ink-500">Prepaid only</span>
                    )}
                    <span className="badge border border-ink-200 bg-white text-ink-600">
                      {all ? `${ALL_DISTRICTS.length} districts` : `${districts.length} districts`}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {(all ? ['All districts'] : districts).slice(0, 6).map((d) => (
                      <span key={d} className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[12px] font-medium text-ink-600">
                        {d}
                      </span>
                    ))}
                    {!all && districts.length > 6 && (
                      <span className="rounded-md bg-ink-100 px-1.5 py-0.5 text-[12px] font-medium text-ink-500">
                        +{districts.length - 6} more
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex items-center gap-1 border-t border-ink-100 pt-3">
                    <button
                      onClick={() => openEdit(z)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold text-ink-600 transition hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => remove(z.id)}
                      disabled={deleting === z.id}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                    >
                      {deleting === z.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card grid place-items-center py-16 text-center">
            <Truck className="h-8 w-8 text-ink-300" />
            <p className="mt-3 text-[15px] font-medium text-ink-600">No shipping zones yet.</p>
          </div>
        )
      ) : (
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">Default shipping rules</h2>
              <p className="mt-0.5 text-[15px] text-ink-500">
                Applied when a district isn&apos;t matched by any zone above.
              </p>
            </div>
            {defaultsSaved && (
              <span className="flex items-center gap-1 text-[13px] font-semibold text-emerald-600">
                <Check className="h-3.5 w-3.5" /> Saved
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {settings.map((s) => (
              <div key={s.key} className={s.type === 'textarea' ? 'sm:col-span-2' : ''}>
                <label className="label">{s.label || s.key}</label>
                {s.type === 'boolean' ? (
                  <button
                    onClick={() => setDefaults((p) => ({ ...p, [s.key]: p[s.key] === 'true' ? 'false' : 'true' }))}
                    className={cn(
                      'flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-[15px] font-medium transition',
                      defaults[s.key] === 'true'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-ink-200 bg-white text-ink-500'
                    )}
                  >
                    {defaults[s.key] === 'true' ? 'Enabled' : 'Disabled'}
                    <span
                      className={cn(
                        'relative h-5 w-9 rounded-full transition',
                        defaults[s.key] === 'true' ? 'bg-emerald-500' : 'bg-ink-300'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all',
                          defaults[s.key] === 'true' ? 'left-[18px]' : 'left-0.5'
                        )}
                      />
                    </span>
                  </button>
                ) : (
                  <input
                    type={s.type === 'number' ? 'number' : 'text'}
                    value={defaults[s.key] ?? ''}
                    onChange={(e) => setDefaults((p) => ({ ...p, [s.key]: e.target.value }))}
                    className="input"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 flex justify-end">
            <button onClick={saveDefaults} disabled={savingDefaults} className="btn-primary">
              {savingDefaults ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save defaults
            </button>
          </div>
        </div>
      )}

      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-sm">
          <button className="flex-1" onClick={() => setPanel(null)} aria-label="Close" />
          <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">
                {panel.id ? 'Edit shipping zone' : 'New shipping zone'}
              </h2>
              <button onClick={() => setPanel(null)} className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 hover:bg-ink-100">
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
                <div className="col-span-2">
                  <label className="label">Zone name *</label>
                  <input
                    value={panel.name}
                    onChange={(e) => setPanel({ ...panel, name: e.target.value })}
                    className="input"
                    placeholder="e.g. Dhaka City (Inside)"
                  />
                </div>

                <div>
                  <label className="label">Method</label>
                  <select
                    value={panel.method}
                    onChange={(e) => setPanel({ ...panel, method: e.target.value })}
                    className="select"
                  >
                    <option value="flat">Flat rate</option>
                    <option value="free">Free shipping</option>
                    <option value="freeship_over">Free over amount</option>
                    <option value="weight">By weight</option>
                  </select>
                </div>

                <div>
                  <label className="label">Rate (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={panel.rate}
                    onChange={(e) => setPanel({ ...panel, rate: Number(e.target.value) })}
                    className="input"
                    disabled={panel.method === 'free'}
                  />
                </div>

                <div>
                  <label className="label">Free shipping over (৳)</label>
                  <input
                    type="number"
                    min={0}
                    value={panel.freeOver}
                    placeholder="Leave empty for none"
                    onChange={(e) => setPanel({ ...panel, freeOver: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Sort position</label>
                  <input
                    type="number"
                    value={panel.position}
                    onChange={(e) => setPanel({ ...panel, position: Number(e.target.value) })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Min. delivery days</label>
                  <input
                    type="number"
                    min={0}
                    value={panel.minDays}
                    onChange={(e) => setPanel({ ...panel, minDays: Number(e.target.value) })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Max. delivery days</label>
                  <input
                    type="number"
                    min={0}
                    value={panel.maxDays}
                    onChange={(e) => setPanel({ ...panel, maxDays: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Covered districts</label>
                  <button
                    onClick={() =>
                      setPanel({ ...panel, districts: panel.districts === 'ALL' ? '' : 'ALL' })
                    }
                    className={cn('chip text-[12px]', panel.districts === 'ALL' && 'chip-active')}
                  >
                    <MapPin className="h-3 w-3" /> All districts
                  </button>
                </div>

                {panel.districts !== 'ALL' && (
                  <div className="mt-2 max-h-64 space-y-3 overflow-y-auto rounded-xl border border-ink-200 p-3">
                    {Object.entries(BD_DISTRICTS).map(([division, districts]) => (
                      <div key={division}>
                        <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-400">
                          {division}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {districts.map((d) => {
                            const isSel = selected.includes(d);
                            const isClaimed = claimed.has(d);
                            return (
                              <button
                                key={d}
                                onClick={() => toggleDistrict(d)}
                                disabled={isClaimed}
                                title={isClaimed ? 'Already covered by another zone' : undefined}
                                className={cn(
                                  'rounded-md border px-2 py-1 text-[12px] font-medium transition',
                                  isClaimed
                                    ? 'cursor-not-allowed border-ink-100 bg-ink-50 text-ink-300 line-through'
                                    : isSel
                                    ? 'border-brand-600 bg-brand-600 text-white'
                                    : 'border-ink-200 bg-white text-ink-600 hover:border-brand-400'
                                )}
                              >
                                {d}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="mt-1.5 text-[13px] text-ink-400">
                  {panel.districts === 'ALL'
                    ? 'This zone covers every district as a fallback.'
                    : `${selected.length} district${selected.length === 1 ? '' : 's'} selected.`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <select
                    value={panel.status}
                    onChange={(e) => setPanel({ ...panel, status: e.target.value })}
                    className="select"
                  >
                    <option value="active">Active</option>
                    <option value="disabled">Disabled</option>
                  </select>
                </div>
                <label className="flex cursor-pointer items-end gap-2.5 pb-2.5">
                  <input
                    type="checkbox"
                    checked={panel.codEnabled}
                    onChange={(e) => setPanel({ ...panel, codEnabled: e.target.checked })}
                    className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-[15px] font-medium text-ink-700">Allow cash on delivery</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-100 bg-white px-5 py-4">
              <button onClick={() => setPanel(null)} className="btn-outline">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {panel.id ? 'Save changes' : 'Create zone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
