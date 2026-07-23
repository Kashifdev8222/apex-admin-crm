"use client";

import { useTransition } from "react";

/** Deposit/Withdraw status actions: Completed, Pending, Canceled, Rejected (+ reason). */
export function TxStatusActions({
  id,
  currentStatus,
  action,
}: {
  id: string;
  currentStatus: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  const st = String(currentStatus || "").toUpperCase();
  const locked = st === "COMPLETED" || st === "CANCELED";
  const open = st === "PENDING" || st === "PROCESSING" || st === "FAILED";

  function run(status: string, askReason = false) {
    start(async () => {
      let note = "";
      if (askReason) {
        const entered = window.prompt("Rejection reason (shown to client):", "");
        if (entered === null) return;
        note = entered.trim() || "Rejected by admin";
      }
      const fd = new FormData();
      fd.set("id", id);
      fd.set("status", status);
      if (note) fd.set("note", note);
      await action(fd);
    });
  }

  if (locked && st === "COMPLETED") {
    return <span className="muted">Completed</span>;
  }

  return (
    <div className="row-actions">
      {open || st === "FAILED" ? (
        <button
          type="button"
          className="btn btn-ok btn-sm"
          disabled={pending}
          onClick={() => run("COMPLETED")}
        >
          Complete
        </button>
      ) : null}
      {st === "PENDING" || st === "PROCESSING" ? (
        <>
          <button
            type="button"
            className="btn btn-warn btn-sm"
            disabled={pending}
            onClick={() => run("FAILED", true)}
          >
            Reject
          </button>
          <button
            type="button"
            className="btn btn-soft btn-sm"
            disabled={pending}
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
          disabled={pending}
          onClick={() => run("PENDING")}
        >
          Reopen Pending
        </button>
      ) : null}
    </div>
  );
}
