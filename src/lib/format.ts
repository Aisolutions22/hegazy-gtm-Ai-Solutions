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

export function fmtMonth(d: string | Date | null | undefined, locale = "en") {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
  }).format(date);
}
