"use client";

export function TruncateTip({
  text,
  max = 28,
}: {
  text: string | null | undefined;
  max?: number;
}) {
  const raw = String(text || "").trim();
  if (!raw || raw === "—") return <span className="muted">—</span>;
  if (raw.length <= max) return <span>{raw}</span>;
  const short = `${raw.slice(0, max).trimEnd()}…`;
  return (
    <span className="tip-cell" title={raw} data-tip={raw}>
      {short}
    </span>
  );
}
