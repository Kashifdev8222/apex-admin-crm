"use client";

import { useEffect, useId, useState, useTransition } from "react";

type ReasonMode = "reject" | "cancel" | null;

export function StatusReasonModal({
  mode,
  onClose,
  onConfirm,
  pending,
}: {
  mode: ReasonMode;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  pending?: boolean;
}) {
  const [reason, setReason] = useState("");
  const titleId = useId();
  const open = mode !== null;

  useEffect(() => {
    if (open) setReason("");
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mode) return null;

  const isReject = mode === "reject";
  const title = isReject ? "Rejection Reason" : "Cancel Reason";
  const hint = isReject
    ? "Shown to the client as the rejection reason. Original comment stays unchanged."
    : "Shown to the client as the cancel reason. Original comment stays unchanged.";
  const placeholder = isReject
    ? "e.g. Amount below minimum / KYC mismatch"
    : "e.g. Client requested cancel / Duplicate request";
  const confirmLabel = isReject ? "Confirm Reject" : "Confirm Cancel";
  const defaultReason = isReject ? "Rejected by admin" : "Canceled by admin";

  return (
    <div className="modal-root" role="presentation" onClick={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-card__head">
          <h3 id={titleId}>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="modal-card__hint">{hint}</p>
        <textarea
          className="modal-textarea"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
        <div className="modal-card__actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={pending}>
            Close
          </button>
          <button
            type="button"
            className={isReject ? "btn btn-danger" : "btn btn-warn"}
            disabled={pending}
            onClick={() => onConfirm(reason.trim() || defaultReason)}
          >
            {pending ? "Saving…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Demo-style Approve / Reject (btn-xs) in one horizontal row. */
export function TxStatusActions({
  id,
  currentStatus,
  action,
}: {
  id: string;
  currentStatus: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [busy, start] = useTransition();
  const [mode, setMode] = useState<ReasonMode>(null);
  const st = String(currentStatus || "").toUpperCase();

  function run(status: string, note?: string) {
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("status", status);
      if (note) fd.set("note", note);
      await action(fd);
      setMode(null);
    });
  }

  if (st === "COMPLETED") {
    return <span className="muted" style={{ fontSize: 11 }}>Completed</span>;
  }
  if (st === "CANCELED") {
    return <span className="muted" style={{ fontSize: 11 }}>Canceled</span>;
  }
  if (st === "FAILED") {
    return (
      <button
        type="button"
        className="btn btn-outline btn-xs"
        disabled={busy}
        onClick={() => run("PENDING")}
      >
        Reopen
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-success btn-xs"
        disabled={busy}
        onClick={() => run("COMPLETED")}
      >
        Approve
      </button>
      <button
        type="button"
        className="btn btn-danger btn-xs"
        disabled={busy}
        onClick={() => setMode("reject")}
      >
        Reject
      </button>
      <StatusReasonModal
        mode={mode}
        pending={busy}
        onClose={() => setMode(null)}
        onConfirm={(reason) =>
          run(mode === "cancel" ? "CANCELED" : "FAILED", reason)
        }
      />
    </>
  );
}
