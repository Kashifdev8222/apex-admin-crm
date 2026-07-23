"use client";

import { useEffect, useId, useState, useTransition } from "react";

export function RejectReasonModal({
  open,
  onClose,
  onConfirm,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  pending?: boolean;
}) {
  const [reason, setReason] = useState("");
  const titleId = useId();

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

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
          <h3 id={titleId}>Rejection Reason</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <p className="modal-card__hint">
          This reason is shown to the client. The original comment stays unchanged.
        </p>
        <textarea
          className="modal-textarea"
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Amount below minimum / Document mismatch / Test reject"
          autoFocus
        />
        <div className="modal-card__actions">
          <button type="button" className="btn btn-soft" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-bad"
            disabled={pending}
            onClick={() => onConfirm(reason.trim() || "Rejected by admin")}
          >
            {pending ? "Saving…" : "Confirm Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [modalOpen, setModalOpen] = useState(false);
  const st = String(currentStatus || "").toUpperCase();

  function run(status: string, note?: string) {
    start(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("status", status);
      if (note) fd.set("note", note);
      await action(fd);
      setModalOpen(false);
    });
  }

  if (st === "COMPLETED") {
    return <span className="muted">Completed</span>;
  }
  if (st === "CANCELED") {
    return <span className="muted">Canceled</span>;
  }

  return (
    <>
      <div className="row-actions">
        <button
          type="button"
          className="btn btn-ok btn-sm"
          disabled={busy}
          onClick={() => run("COMPLETED")}
        >
          Complete
        </button>
        {st === "PENDING" || st === "PROCESSING" ? (
          <>
            <button
              type="button"
              className="btn btn-warn btn-sm"
              disabled={busy}
              onClick={() => setModalOpen(true)}
            >
              Reject
            </button>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              disabled={busy}
              onClick={() => run("CANCELED")}
            >
              Cancel
            </button>
          </>
        ) : null}
        {st === "FAILED" ? (
          <button
            type="button"
            className="btn btn-soft btn-sm"
            disabled={busy}
            onClick={() => run("PENDING")}
          >
            Reopen
          </button>
        ) : null}
      </div>
      <RejectReasonModal
        open={modalOpen}
        pending={busy}
        onClose={() => setModalOpen(false)}
        onConfirm={(reason) => run("FAILED", reason)}
      />
    </>
  );
}
