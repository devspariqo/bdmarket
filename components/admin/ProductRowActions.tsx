'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Eye, MoreVertical, Copy, Loader2, Archive } from 'lucide-react';

export default function ProductRowActions({
  id, slug, name, status,
}: { id: string; slug: string; name: string; status: string }) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function del() {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert('Failed to delete product');
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  }

  async function duplicate() {
    try {
      const res = await fetch(`/api/admin/products/${id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert('Failed to duplicate');
    }
  }

  return (
    <div className="relative flex items-center justify-end gap-1">
      <Link
        href={`/admin/products/${id}`}
        className="rounded-lg p-2 text-ink-500 transition hover:bg-blue-50 hover:text-blue-600"
        title="Edit"
      >
        <Edit className="h-3.5 w-3.5" />
      </Link>
      <Link
        href={`/product/${slug}`}
        target="_blank"
        className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-800"
        title="View on storefront"
      >
        <Eye className="h-3.5 w-3.5" />
      </Link>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-ink-500 transition hover:bg-ink-100"
          aria-label="More actions"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreVertical className="h-3.5 w-3.5" />}
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-20 mt-1 w-44 animate-fade-in rounded-xl border border-ink-200 bg-white p-1.5 shadow-pop">
              <button onClick={duplicate} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-700 transition hover:bg-ink-50">
                <Copy className="h-3.5 w-3.5 text-ink-400" /> Duplicate
              </button>
              <button
                onClick={() => { setOpen(false); }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-700 transition hover:bg-ink-50"
              >
                <Archive className="h-3.5 w-3.5 text-ink-400" /> Archive
              </button>
              <button
                onClick={del}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-rose-600 transition hover:bg-rose-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
