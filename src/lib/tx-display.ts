/** comment = client deposit/withdraw text; note = reason for Rejected OR Canceled */
export function displayComment(row: {
  comment?: string | null;
  paymentMethod?: string | null;
  payCurrency?: string | null;
}) {
  const c = String(row.comment || "").trim();
  if (c) return c;
  if (row.paymentMethod && row.payCurrency) return `${row.paymentMethod} ${row.payCurrency}`;
  return row.paymentMethod || "—";
}

export function displayRejectReason(row: {
  status: string;
  note?: string | null;
  comment?: string | null;
}) {
  const st = String(row.status).toUpperCase();
  if (st !== "FAILED" && st !== "CANCELED" && st !== "CANCELLED") return "—";
  const note = String(row.note || "").trim();
  const comment = String(row.comment || "").trim();
  if (!note || note === comment) return "—";
  return note;
}
