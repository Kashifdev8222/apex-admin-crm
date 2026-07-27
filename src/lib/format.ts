export function capitalize(value: string | null | undefined) {
  if (!value) return "—";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const ISO_CURRENCY = /^[A-Z]{3}$/;

/** Safe money formatter — never throws on crypto codes like USDT/BTC. */
export function money(
  n: number | string | { toString(): string } | null | undefined,
  currency = "USD",
) {
  const value = typeof n === "number" ? n : Number(n ?? 0);
  const amount = Number.isFinite(value) ? value : 0;
  const raw = String(currency || "USD")
    .trim()
    .toUpperCase();
  const code = ISO_CURRENCY.test(raw) ? raw : "USD";

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return "—";
  }
}

export function statusTone(status: string) {
  const s = status.toUpperCase();
  if (["COMPLETED", "APPROVED", "ACTIVE", "RESOLVED", "CLOSED", "VERIFIED"].includes(s)) {
    return "ok";
  }
  if (["PENDING", "PROCESSING", "NEW", "OPEN", "SCHEDULED"].includes(s)) {
    return "warn";
  }
  if (["FAILED", "CANCELED", "CANCELLED", "REJECTED", "INACTIVE", "BLOCKED"].includes(s)) {
    return "bad";
  }
  return "neutral";
}
