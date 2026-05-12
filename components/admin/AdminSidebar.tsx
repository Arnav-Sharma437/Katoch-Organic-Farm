"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/dashboard/gallery", label: "Gallery" },
  { href: "/admin/dashboard/testimonials", label: "Testimonials" },
  { href: "/admin/dashboard/contacts", label: "Contact Submissions" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/contact", { credentials: "include" });
        if (!res.ok) return;
        const data = (await res.json()) as { isRead: boolean }[];
        if (!cancelled) {
          setUnread(data.filter((c) => !c.isRead).length);
        }
      } catch {
        if (!cancelled) setUnread(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Admin</p>
        <p className="font-serif text-lg font-semibold text-[#2d5a27]">Katoch Organic Farm</p>
      </div>
      <div className="border-b border-slate-100 px-3 py-3">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border border-[#2d5a27]/25 bg-[#f4faf5] px-3 py-2.5 text-sm font-semibold text-[#2d5a27] transition hover:border-[#2d5a27]/50 hover:bg-[#e8f2ea]"
        >
          <i className="fas fa-external-link-alt text-xs" aria-hidden />
          View website
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((l) => {
          const active = pathname === l.href;
          const isContacts = l.href.includes("contacts");
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-[#2d5a27] text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <span>{l.label}</span>
              {isContacts && unread !== null && unread > 0 ? (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-slate-900">
                  {unread}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
