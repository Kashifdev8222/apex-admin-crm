"use client";

import { useState, useTransition } from "react";

type Field =
  | {
      name: string;
      label: string;
      type?: "text" | "number";
      defaultValue: string | number;
      required?: boolean;
    }
  | {
      name: string;
      label: string;
      type: "select";
      defaultValue: string;
      options: { value: string; label: string }[];
    };

export function EditRowModal({
  title,
  action,
  hidden,
  fields,
}: {
  title: string;
  action: (formData: FormData) => void | Promise<void>;
  hidden: Record<string, string>;
  fields: Field[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        type="button"
        className="btn btn-soft btn-sm"
        onClick={() => setOpen(true)}
      >
        Edit
      </button>
      {open ? (
        <div
          className="modal-root"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__head">
              <h3>{title}</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <form
              action={(fd) => {
                start(async () => {
                  await action(fd);
                  setOpen(false);
                });
              }}
            >
              {Object.entries(hidden).map(([k, v]) => (
                <input key={k} type="hidden" name={k} value={v} />
              ))}
              {fields.map((f) => (
                <div className="field" key={f.name}>
                  <label htmlFor={`edit-${f.name}`}>{f.label}</label>
                  {f.type === "select" ? (
                    <select
                      id={`edit-${f.name}`}
                      name={f.name}
                      defaultValue={f.defaultValue}
                      style={{ width: "100%", minWidth: 0 }}
                    >
                      {f.options.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`edit-${f.name}`}
                      name={f.name}
                      type={f.type || "text"}
                      defaultValue={f.defaultValue}
                      required={"required" in f ? f.required : true}
                      style={{ width: "100%", minWidth: 0 }}
                    />
                  )}
                </div>
              ))}
              <div className="modal-card__actions">
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
