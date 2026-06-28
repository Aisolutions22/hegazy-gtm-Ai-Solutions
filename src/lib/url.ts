export function isSafeHttpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /^https?:\/\//i.test(url.trim());
}

/** Returns the URL if safe (http/https), otherwise undefined. */
export function safeHref(url: string | null | undefined): string | undefined {
  return isSafeHttpUrl(url) ? (url as string).trim() : undefined;
}

/**
 * Normalize a user-entered URL for storage. Empty -> null. Adds https:// when
 * the user omitted a scheme but the value otherwise looks like a URL/host.
 * Throws if the value contains a non-http(s) scheme.
 */
export function normalizeUrlForStorage(input: string | null | undefined): string | null {
  if (input == null) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
    throw new Error("Only http(s) URLs are allowed");
  }
  return `https://${trimmed}`;
}
