"use client";

import { useTransition } from "react";

export function ConfirmDeleteButton({
  action,
  id,
  label = "Delete",
  confirmText = "Delete this record permanently?",
  hiddenFields,
  className = "btn btn-danger btn-xs",
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  label?: string;
  confirmText?: string;
  hiddenFields?: Record<string, string>;
  className?: string;
}) {
  const [pending, start] = useTransition();

  return (
    <form
      className="inline-action"
      action={(fd) => {
        if (!window.confirm(confirmText)) return;
        start(async () => {
          await action(fd);
        });
      }}
    >
      <input type="hidden" name="id" value={id} />
      {hiddenFields
        ? Object.entries(hiddenFields).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))
        : null}
      <button className={className} type="submit" disabled={pending}>
        {pending ? "…" : label}
      </button>
    </form>
  );
}
