"use client";

import { useEffect, useState } from "react";

function isImage(url: string, fileName: string) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(fileName || url);
}

function isPdf(url: string, fileName: string) {
  return /\.pdf(\?|$)/i.test(fileName || url);
}

export function KycPreviewButton({
  url,
  fileName,
}: {
  url: string;
  fileName: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
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

  const image = isImage(url, fileName);
  const pdf = isPdf(url, fileName);

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
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt={fileName} className="kyc-modal__img" />
              ) : pdf ? (
                <iframe
                  src={url}
                  title={fileName}
                  className="kyc-modal__frame"
                />
              ) : (
                <div className="kyc-modal__fallback">
                  <p className="muted">Preview not available for this file type.</p>
                  <a
                    className="btn btn-primary"
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open file
                  </a>
                </div>
              )}
            </div>
            <div className="modal-card__actions">
              <a
                className="btn btn-soft"
                href={url}
                target="_blank"
                rel="noreferrer"
              >
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
