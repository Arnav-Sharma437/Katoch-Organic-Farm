/** Canonical site origin (no trailing slash). */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "https://www.katochorganicfarm.com";
  return raw.replace(/\/$/, "");
}
