/** Split env like "a@b.com, c@d.com" into valid addresses. */
export function parseEmailRecipients(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const normalized = raw
    .replace(/\uFEFF/g, "")
    .replace(/[\uFF0C\u3001]/g, ",")
    .replace(/[\u200B-\u200D]/g, "");
  const parts = normalized
    .split(/[,;\n]+/)
    .map((s) => s.replace(/[\u200B-\u200D\uFEFF]/g, "").trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
  return Array.from(new Set(parts));
}
