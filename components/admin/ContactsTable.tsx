"use client";

import { useCallback, useEffect, useState } from "react";

export type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ContactsTable() {
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactRow | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/contact", { credentials: "include", cache: "no-store" });
    if (res.ok) setRows(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id: string) {
    const res = await fetch(`/api/contact/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isRead: true }),
    });
    if (!res.ok) alert("Failed to mark read");
    else await load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this submission?")) return;
    const res = await fetch(`/api/contact/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) alert("Delete failed");
    else {
      setSelected((s) => (s?.id === id ? null : s));
      await load();
    }
  }

  if (loading) return <p className="text-slate-600">Loading submissions…</p>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Contact Submissions</h1>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Message</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelected(r)}
                className={`cursor-pointer border-t border-slate-100 ${
                  !r.isRead ? "bg-amber-50" : "hover:bg-slate-50"
                }`}
              >
                <td className="px-4 py-3 text-slate-600">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {r.firstName} {r.lastName}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.email}</td>
                <td className="max-w-xs truncate px-4 py-3 text-slate-600">{r.message}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      r.isRead ? "bg-slate-200 text-slate-700" : "bg-amber-200 text-amber-900"
                    }`}
                  >
                    {r.isRead ? "Read" : "Unread"}
                  </span>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-wrap gap-2">
                    {!r.isRead ? (
                      <button
                        type="button"
                        className="rounded border border-slate-200 px-2 py-1 text-xs hover:bg-white"
                        onClick={() => markRead(r.id)}
                      >
                        Mark read
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="rounded border border-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      onClick={() => remove(r.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Message</h2>
              <button type="button" className="text-slate-500" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>
            <p className="text-sm text-slate-500">{formatDate(selected.createdAt)}</p>
            <p className="mt-2 font-medium text-slate-900">
              {selected.firstName} {selected.lastName} · {selected.email}
            </p>
            <p className="mt-4 whitespace-pre-wrap text-slate-700">{selected.message}</p>
            <div className="mt-6 flex gap-2">
              {!selected.isRead ? (
                <button
                  type="button"
                  className="rounded-lg bg-[#2d5a27] px-4 py-2 text-sm font-semibold text-white"
                  onClick={() => {
                    markRead(selected.id);
                    setSelected({ ...selected, isRead: true });
                  }}
                >
                  Mark as read
                </button>
              ) : null}
              <button
                type="button"
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600"
                onClick={() => remove(selected.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
