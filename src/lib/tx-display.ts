/** comment = client deposit/withdraw text; note = rejection reason only when FAILED */
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
  if (String(row.status).toUpperCase() !== "FAILED") return "—";
  const note = String(row.note || "").trim();
  const comment = String(row.comment || "").trim();
  if (!note || note === comment) return "—";
  return note;
}
