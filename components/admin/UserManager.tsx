'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, KeyRound, Loader2, Lock, Pencil, Plus, Search, ShieldCheck,
  Trash2, UserCog, UserRound, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ImageUploadField from '@/components/admin/settings/ImageUploadField';

type U = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatar: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  activityCount: number;
};

const EMPTY = {
  id: '',
  name: '',
  email: '',
  phone: '',
  role: 'EDITOR',
  status: 'active',
  password: '',
  /** Avatar URL. The column already existed and the list rendered it, but there
   *  was no field to set it, so every admin fell back to initials. */
  avatar: '',
};

const ROLE_TONE: Record<string, string> = {
  ADMIN: 'border-rose-200 bg-rose-50 text-rose-700',
  MANAGER: 'border-blue-200 bg-blue-50 text-blue-700',
  EDITOR: 'border-amber-200 bg-amber-50 text-amber-700',
  CUSTOMER: 'border-ink-200 bg-ink-50 text-ink-600',
};

export default function UserManager({ users, currentUserId }: { users: U[]; currentUserId: string }) {
  const router = useRouter();
  const [list, setList] = useState(users);
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState<null | typeof EMPTY>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => setList(users), [users]);
  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.includes(q) || u.role.toLowerCase().includes(q)
    );
  }, [list, search]);

  async function save() {
    if (!panel) return;
    if (!panel.name.trim() || !panel.email.trim()) return setErr('Name and email are required');
    if (!panel.id && !panel.password) return setErr('A password is required for new users');
    setSaving(true);
    setErr('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...panel, id: panel.id || undefined }),
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

  async function toggleStatus(u: U) {
    const next = u.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id, status: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setList((p) => p.map((x) => (x.id === u.id ? { ...x, status: next } : x)));
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    }
  }

  async function remove(u: U) {
    if (!confirm(`Delete ${u.name}? They will lose access immediately.`)) return;
    setDeleting(u.id);
    try {
      const res = await fetch(`/api/admin/users?id=${u.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setList((p) => p.filter((x) => x.id !== u.id));
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="input pl-9"
          />
        </div>
        <button onClick={() => { setErr(''); setPanel({ ...EMPTY }); }} className="btn-primary">
          <Plus className="h-4 w-4" /> New user
        </button>
      </div>

      <div className="table-wrap">
        <table className="w-full min-w-[760px]">
          <thead className="bg-ink-50/70">
            <tr>
              <th className="th">User</th>
              <th className="th">Role</th>
              <th className="th">Status</th>
              <th className="th">Last login</th>
              <th className="th">Activity</th>
              <th className="th">Joined</th>
              <th className="th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-b border-ink-100 transition hover:bg-ink-50/50">
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-50 font-display text-[13px] font-bold text-brand-700">
                          {u.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={u.avatar} alt="" className="h-full w-full object-cover" />
                          ) : (
                            u.name.slice(0, 1).toUpperCase()
                          )}
                        </span>
                        <div className="min-w-0">
                          <span className="flex items-center gap-1.5 truncate font-semibold text-ink-900">
                            {u.name}
                            {isSelf && (
                              <span className="badge border border-brand-200 bg-brand-50 text-brand-700">you</span>
                            )}
                          </span>
                          <span className="block truncate text-[13px] text-ink-400">{u.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="td">
                      <span className={cn('badge border', ROLE_TONE[u.role] || ROLE_TONE.CUSTOMER)}>{u.role}</span>
                    </td>
                    <td className="td">
                      <button
                        onClick={() => !isSelf && toggleStatus(u)}
                        disabled={isSelf}
                        className={cn(
                          'badge border transition',
                          isSelf && 'cursor-not-allowed opacity-70',
                          u.status === 'active'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                        )}
                        title={isSelf ? 'You cannot change your own status' : 'Click to toggle'}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="td whitespace-nowrap text-[13px] text-ink-500">
                      {u.lastLoginAt || <span className="text-ink-300">never</span>}
                    </td>
                    <td className="td">
                      <span className="badge border border-ink-200 bg-white text-ink-600">
                        {u.activityCount} events
                      </span>
                    </td>
                    <td className="td whitespace-nowrap text-[13px] text-ink-500">{u.createdAt}</td>
                    <td className="td">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setErr('');
                            setPanel({
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              phone: u.phone || '',
                              role: u.role,
                              status: u.status,
                              password: '',
                              avatar: u.avatar || '',
                            });
                          }}
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-blue-50 hover:text-blue-700"
                          title="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => remove(u)}
                          disabled={isSelf || deleting === u.id}
                          title={isSelf ? 'You cannot delete yourself' : 'Delete user'}
                          className="grid h-8 w-8 place-items-center rounded-lg text-ink-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          {deleting === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="td py-14 text-center text-ink-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {panel && (
        <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40 backdrop-blur-sm">
          <button className="flex-1" onClick={() => setPanel(null)} aria-label="Close" />
          <div className="flex h-full w-full max-w-lg flex-col overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-100 bg-white px-5 py-4">
              <h2 className="font-display text-lg font-bold text-ink-900">
                {panel.id ? 'Edit user' : 'New admin user'}
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

              <div>
                <label className="label">Full name *</label>
                <input
                  value={panel.name}
                  onChange={(e) => setPanel({ ...panel, name: e.target.value })}
                  className="input"
                  placeholder="Rahim Uddin"
                />
              </div>

              <div>
                <label className="label">Email address *</label>
                <input
                  type="email"
                  value={panel.email}
                  onChange={(e) => setPanel({ ...panel, email: e.target.value })}
                  className="input"
                  placeholder="rahim@bdmarket.com.bd"
                />
              </div>

              <div>
                <label className="label">Phone</label>
                <input
                  value={panel.phone}
                  onChange={(e) => setPanel({ ...panel, phone: e.target.value })}
                  className="input"
                  placeholder="01700000000"
                />
              </div>

              <div className="sm:col-span-2">
                <ImageUploadField
                  value={panel.avatar}
                  onChange={(url) => setPanel({ ...panel, avatar: url })}
                  label="Profile photo"
                  maxWidth={400}
                  previewClassName="h-16 w-16 rounded-full"
                  hint="Shown as the rounded avatar beside your name in the top-right of the admin. A square image works best; without one, your initials are used."
                />
              </div>

              <div>
                <label className="label">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ADMIN', 'MANAGER', 'EDITOR'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setPanel({ ...panel, role: r })}
                      className={cn(
                        'rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition',
                        panel.role === r
                          ? 'border-brand-600 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                          : 'border-ink-200 text-ink-600 hover:border-ink-300'
                      )}
                    >
                      {r === 'ADMIN' ? <ShieldCheck className="mx-auto mb-1 h-4 w-4" /> : r === 'MANAGER' ? <UserCog className="mx-auto mb-1 h-4 w-4" /> : <UserRound className="mx-auto mb-1 h-4 w-4" />}
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">
                  {panel.id ? 'New password (leave blank to keep current)' : 'Password *'}
                </label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    value={panel.password}
                    onChange={(e) => setPanel({ ...panel, password: e.target.value })}
                    className="input pl-9 font-mono text-[13px]"
                    placeholder={panel.id ? '••••••••' : 'Minimum 6 characters'}
                    autoComplete="new-password"
                  />
                </div>
                <p className="mt-1 text-[12px] text-ink-400">
                  Passwords are hashed with bcrypt before being stored.
                </p>
              </div>

              <div>
                <label className="label">Account status</label>
                <select
                  value={panel.status}
                  onChange={(e) => setPanel({ ...panel, status: e.target.value })}
                  className="select"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-ink-100 bg-white px-5 py-4">
              <button onClick={() => setPanel(null)} className="btn-outline">
                Cancel
              </button>
              <button onClick={save} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {panel.id ? 'Save changes' : 'Create user'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
