/**
 * Passwords with "@" must be URL-encoded in MONGODB_URI (e.g. admin@123 → admin%40123).
 * This fixes common copy/paste mistakes on Vercel.
 */
export function resolveMongoUri(): string {
  const raw = process.env.MONGODB_URI?.trim();
  if (!raw) {
    throw new Error("MONGODB_URI is not set");
  }

  const schemeMatch = raw.match(/^(mongodb(?:\+srv)?:\/\/)/);
  if (!schemeMatch) return raw;

  const scheme = schemeMatch[1];
  const rest = raw.slice(scheme.length);
  const at = rest.lastIndexOf("@");
  if (at <= 0) return raw;

  const creds = rest.slice(0, at);
  const host = rest.slice(at + 1);
  const colon = creds.indexOf(":");
  if (colon <= 0) return raw;

  const user = creds.slice(0, colon);
  const pass = creds.slice(colon + 1);

  if (!pass.includes("@") || pass.includes("%40")) return raw;

  return `${scheme}${user}:${encodeURIComponent(pass)}@${host}`;
}
