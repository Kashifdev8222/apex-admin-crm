export function money(n: number | string | { toString(): string }, currency = "USD") {
  const value = typeof n === "number" ? n : Number(n);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

export function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function statusTone(status: string) {
  const s = status.toUpperCase();
  if (["COMPLETED", "APPROVED", "ACTIVE", "RESOLVED", "CLOSED"].includes(s)) {
    return "ok";
  }
  if (["PENDING", "PROCESSING", "NEW", "OPEN", "SCHEDULED"].includes(s)) {
    return "warn";
  }
  if (["FAILED", "CANCELED", "REJECTED", "INACTIVE"].includes(s)) {
    return "bad";
  }
  return "neutral";
}
