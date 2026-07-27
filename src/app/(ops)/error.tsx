"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function OpsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Ops page error:", error);
  }, [error]);

  return (
    <div className="dash-panel" style={{ maxWidth: 520, margin: "40px auto" }}>
      <h2 style={{ fontFamily: "var(--fh)", fontSize: 18, margin: "0 0 8px" }}>
        Something went wrong
      </h2>
      <p className="muted" style={{ fontSize: 13, margin: "0 0 16px" }}>
        {error.message || "A server error occurred while loading this page."}
        {error.digest ? (
          <>
            <br />
            <span style={{ fontSize: 11 }}>Digest: {error.digest}</span>
          </>
        ) : null}
      </p>
      <div className="row-actions">
        <button type="button" className="btn btn-primary btn-sm" onClick={reset}>
          Try again
        </button>
        <Link href="/dashboard" className="btn btn-outline btn-sm">
          Dashboard
        </Link>
        <Link href="/login" className="btn btn-outline btn-sm">
          Login
        </Link>
      </div>
    </div>
  );
}
