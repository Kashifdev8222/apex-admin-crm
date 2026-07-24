"use client";

import { useEffect, useState } from "react";

function isImage(fileName: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);
}

function isPdf(fileName: string) {
  return /\.pdf$/i.test(fileName);
}

export function KycPreviewButton({
  id,
  fileName,
  fallbackUrl,
}: {
  id: string;
  fileName: string;
  fallbackUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const previewUrl = `/api/kyc/${id}/file`;
  const openUrl = previewUrl;

  useEffect(() => {
    if (!open) return;
    setFailed(false);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const image = isImage(fileName);
  const pdf = isPdf(fileName);

  return (
    <>
      <button
        type="button"
        className="btn-link"
        onClick={() => setOpen(true)}
        title="Preview document"
      >
        {fileName || "View file"}
      </button>
      {open ? (
        <div
          className="modal-root kyc-modal"
          role="dialog"
          aria-modal="true"
          aria-label="KYC document preview"
          onClick={() => setOpen(false)}
        >
          <div
            className="modal-card kyc-modal__card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-card__head">
              <h3 title={fileName}>{fileName}</h3>
              <button
                type="button"
                className="modal-close"
                aria-label="Close"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="kyc-modal__body">
              {failed ? (
                <div className="kyc-modal__fallback">
                  <p className="muted">Could not load preview.</p>
                  <a className="btn btn-primary" href={openUrl} target="_blank" rel="noreferrer">
                    Open file
                  </a>
                  {fallbackUrl ? (
                    <a className="btn btn-soft" href={fallbackUrl} target="_blank" rel="noreferrer">
                      Direct link
                    </a>
                  ) : null}
                </div>
              ) : image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={fileName}
                  className="kyc-modal__img"
                  referrerPolicy="no-referrer"
                  onError={() => setFailed(true)}
                />
              ) : pdf ? (
                <iframe
                  src={previewUrl}
                  title={fileName}
                  className="kyc-modal__frame"
                />
              ) : (
                <div className="kyc-modal__fallback">
                  <p className="muted">Preview not available for this file type.</p>
                  <a className="btn btn-primary" href={openUrl} target="_blank" rel="noreferrer">
                    Open file
                  </a>
                </div>
              )}
            </div>
            <div className="modal-card__actions">
              <a className="btn btn-soft" href={openUrl} target="_blank" rel="noreferrer">
                Open in new tab
              </a>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
