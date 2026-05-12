import Link from "next/link";
import { internalServerFetch } from "@/lib/server-fetch";

async function countJson(path: string): Promise<number> {
  const res = await internalServerFetch(path);
  if (!res.ok) return 0;
  const data: unknown = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

export default async function AdminDashboardHome() {
  const [galleryCount, testimonialList, contacts] = await Promise.all([
    countJson("/api/gallery"),
    internalServerFetch("/api/testimonials").then(async (r) => {
      if (!r.ok) return [] as { isRead?: boolean }[];
      return r.json() as Promise<{ isRead?: boolean }[]>;
    }),
    internalServerFetch("/api/contact").then(async (r) => {
      if (!r.ok) return [] as { isRead: boolean }[];
      return r.json() as Promise<{ isRead: boolean }[]>;
    }),
  ]);

  const testimonialTotal = testimonialList.length;
  const unreadContacts = contacts.filter((c) => !c.isRead).length;

  const cards = [
    { label: "Total Gallery Items", value: galleryCount, href: "/admin/dashboard/gallery" },
    { label: "Total Testimonials", value: testimonialTotal, href: "/admin/dashboard/testimonials" },
    { label: "Unread Contacts", value: unreadContacts, href: "/admin/dashboard/contacts" },
  ];

  return (
    <div>
      <h1 className="mb-2 text-3xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mb-8 text-slate-600">Welcome back. Choose a section from the sidebar.</p>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#2d5a27]/40 hover:shadow-md"
          >
            <p className="text-sm font-medium text-slate-500">{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-[#2d5a27]">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
