export function fmtNumber(n: number | null | undefined, locale = "en") {
  if (n == null) return "—";
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", { maximumFractionDigits: 0 }).format(n);
}

export function fmtCurrency(n: number | null | undefined, locale = "en") {
  if (n == null) return "—";
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "currency",
    currency: "EGP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function fmtPercent(n: number | null | undefined, locale = "en") {
  if (n == null) return "—";
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(n / 100);
}

export function fmtDate(d: string | Date | null | undefined, locale = "en") {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function fmtDateTime(d: string | Date | null | undefined, locale = "en") {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function fmtMonth(d: string | Date | null | undefined, locale = "en") {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
  }).format(date);
}

/** YYYY-MM-DD for a local-timezone date (no UTC drift). */
export function localDateISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Add N calendar days to a local date and return YYYY-MM-DD. */
export function addDaysISO(days: number, base: Date = new Date()): string {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);
  return localDateISO(d);
}
