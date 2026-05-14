/** How we read `isVisible` from Mongo / lean() (legacy docs may omit the field). */
export function normalizeStoredVisible(v: unknown): boolean {
  if (v === false || v === "false" || v === 0 || v === "0") return false;
  return true;
}

/** Parse JSON body field; `undefined` means "do not change this field" (PATCH-style). */
export function parseIncomingVisible(v: unknown): boolean | undefined {
  if (v === undefined) return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "true" || s === "1") return true;
    if (s === "false" || s === "0" || s === "") return false;
  }
  if (v === "true" || v === "1" || v === 1) return true;
  if (v === "false" || v === "0" || v === 0 || v === null) return false;
  if (typeof v === "number") return v !== 0;
  return Boolean(v);
}

/** New testimonial: default visible unless explicitly turned off. */
export function visibleForCreate(v: unknown): boolean {
  return parseIncomingVisible(v) !== false;
}
