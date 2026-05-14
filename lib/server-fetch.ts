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

/**
 * Same-host fetch without forwarding cookies. Use for public homepage data so an admin session
 * does not widen API responses (e.g. testimonials visibility).
 */
export function internalServerFetchPublic(path: string, init?: RequestInit) {
  const h = headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return fetch(`${proto}://${host}${path}`, {
    ...init,
    cache: "no-store",
  });
}
