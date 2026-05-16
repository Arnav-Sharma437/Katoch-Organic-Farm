/** Resend accepts `Name <email@domain.com>`. */
export function formatResendFrom(raw: string) {
  const trimmed = raw.trim();
  if (/<[^>]+@[^>]+>/.test(trimmed)) return trimmed;
  return `Katoch Organic Farm <${trimmed}>`;
}
