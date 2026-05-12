"use client";

import { useCallback, useEffect, useState } from "react";

export type TestimonialRow = {
  id: string;
  name: string;
  quote: string;
  isVisible: boolean;
  order: number;
};

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button type="button" className="text-slate-500 hover:text-slate-800" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function TestimonialManager() {
  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<TestimonialRow | null>(null);
  const [name, setName] = useState("");
  const [quote, setQuote] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/testimonials", { credentials: "include", cache: "no-store" });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setName("");
    setQuote("");
    setIsVisible(true);
    setModal("add");
  }

  function openEdit(row: TestimonialRow) {
    setEditing(row);
    setName(row.name);
    setQuote(row.quote);
    setIsVisible(row.isVisible);
    setModal("edit");
  }

  async function save() {
    if (!name.trim() || !quote.trim()) return;
    setSaving(true);
    try {
      const body = {
        name: name.trim(),
        quote: quote.trim(),
        isVisible,
        order: editing?.order ?? 0,
      };
      const url = editing ? `/api/testimonials/${editing.id}` : "/api/testimonials";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert((err as { error?: string }).error ?? "Request failed");
        return;
      }
      setModal(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this testimonial?")) return;
    const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) alert("Delete failed");
    else await load();
  }

  async function toggleVisible(row: TestimonialRow) {
    const res = await fetch(`/api/testimonials/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ isVisible: !row.isVisible }),
    });
    if (!res.ok) alert("Update failed");
    else await load();
  }

  if (loading) return <p className="text-slate-600">Loading testimonials…</p>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Testimonials</h1>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-[#2d5a27] px-4 py-2 text-sm font-semibold text-white hover:bg-[#234622]"
        >
          Add New Testimonial
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Quote</th>
              <th className="px-4 py-3 font-medium">Visible</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                <td className="max-w-md px-4 py-3 text-slate-600">
                  {row.quote.length > 120 ? `${row.quote.slice(0, 120)}…` : row.quote}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={row.isVisible}
                    onClick={() => toggleVisible(row)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                      row.isVisible ? "bg-[#2d5a27]" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        row.isVisible ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded border border-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-50"
                      onClick={() => openEdit(row)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded border border-red-100 px-2 py-1 text-red-600 hover:bg-red-50"
                      onClick={() => remove(row.id)}
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

      <Modal
        open={modal !== null}
        title={modal === "edit" ? "Edit testimonial" : "Add testimonial"}
        onClose={() => setModal(null)}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Quote</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              rows={5}
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={isVisible} onChange={(e) => setIsVisible(e.target.checked)} />
            Visible on website
          </label>
          <button
            type="button"
            disabled={saving || !name.trim() || !quote.trim()}
            onClick={save}
            className="w-full rounded-lg bg-[#2d5a27] py-2 font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
