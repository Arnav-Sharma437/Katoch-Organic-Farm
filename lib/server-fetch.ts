import { headers } from "next/headers";

/** Server-side fetch to this deployment with incoming cookies (for authenticated admin GETs). */
export function internalServerFetch(path: string, init?: RequestInit) {
  const h = headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const cookie = h.get("cookie") ?? "";
  return fetch(`${proto}://${host}${path}`, {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string> | undefined),
      cookie,
    },
    cache: "no-store",
  });
}
