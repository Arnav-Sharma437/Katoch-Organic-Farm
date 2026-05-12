"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type GalleryRow = {
  id: string;
  title: string;
  year: string;
  imageUrl: string;
  cloudinaryPublicId: string;
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
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
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

export default function GalleryManager() {
  const [items, setItems] = useState<GalleryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<GalleryRow | null>(null);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/gallery", { cache: "no-store" });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setTitle("");
    setYear("");
    setFile(null);
    setPreview(null);
    setModal("add");
  }

  function openEdit(item: GalleryRow) {
    setEditing(item);
    setTitle(item.title);
    setYear(item.year);
    setFile(null);
    setPreview(item.imageUrl);
    setModal("edit");
  }

  function onPickFile(f: File | null) {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else if (editing) {
      setPreview(editing.imageUrl);
    } else {
      setPreview(null);
    }
  }

  async function save() {
    if (!title.trim() || !year.trim()) return;
    if (modal === "add" && !file) return;

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("year", year.trim());
      if (file) fd.append("image", file);

      const url = editing ? `/api/gallery/${editing.id}` : "/api/gallery";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, body: fd, credentials: "include" });
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
    if (!confirm("Delete this gallery item?")) return;
    const res = await fetch(`/api/gallery/${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) {
      alert("Delete failed");
      return;
    }
    await load();
  }

  if (loading) {
    return <p className="text-slate-600">Loading gallery…</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Gallery</h1>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-lg bg-[#2d5a27] px-4 py-2 text-sm font-semibold text-white hover:bg-[#234622]"
        >
          Add New Image
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="relative aspect-[4/5] w-full bg-slate-100">
              <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="400px" />
            </div>
            <div className="flex items-start justify-between gap-2 p-3">
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500">{item.year}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Edit"
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                  onClick={() => openEdit(item)}
                >
                  ✎
                </button>
                <button
                  type="button"
                  aria-label="Delete"
                  className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                  onClick={() => remove(item.id)}
                >
                  🗑
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modal !== null}
        title={modal === "edit" ? "Edit image" : "Add image"}
        onClose={() => setModal(null)}
      >
        <div className="space-y-4">
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 py-10 text-center text-sm text-slate-600"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f?.type.startsWith("image/")) onPickFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="relative mx-auto mb-2 h-40 w-full max-w-xs">
                <Image src={preview} alt="Preview" fill className="rounded-lg object-cover" unoptimized={preview.startsWith("blob:")} />
              </div>
            ) : (
              <p>Drag & drop or click to upload</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Year</label>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={saving || !title.trim() || !year.trim() || (modal === "add" && !file)}
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
