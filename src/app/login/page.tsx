"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [hiding, setHiding] = useState(false);
  const [pending, start] = useTransition();
  const [booting, setBooting] = useState(false);

  useEffect(() => {
    router.prefetch("/dashboard");
  }, [router]);

  useEffect(() => {
    if (!error) return;
    setHiding(false);
    const fade = setTimeout(() => setHiding(true), 3500);
    const clear = setTimeout(() => {
      setError(null);
      setHiding(false);
    }, 4000);
    return () => {
      clearTimeout(fade);
      clearTimeout(clear);
    };
  }, [error]);

  return (
    <div className="login-page">
      {(pending || booting) && (
        <div className="boot-overlay" aria-live="polite">
          <div className="boot-card">
            <div className="boot-spinner" />
            <strong>{booting ? "Opening dashboard…" : "Signing in…"}</strong>
            <span>Please wait a moment</span>
          </div>
        </div>
      )}
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">A</div>
          <div>
            <h1>Apex Admin</h1>
            <div className="muted" style={{ fontSize: "0.78rem", marginTop: 2 }}>
              Staff sign-in
            </div>
          </div>
        </div>
        <p>Sign in to manage clients, deposits, withdrawals, KYC, and support.</p>
        {error ? (
          <div className={`error${hiding ? " hiding" : ""}`} role="alert">
            {error}
          </div>
        ) : null}
        <form
          action={(fd) => {
            setError(null);
            start(async () => {
              const res = await loginAction(fd);
              if (!res || !res.ok) {
                setError(res && "error" in res ? res.error : "Login failed");
                return;
              }
              setBooting(true);
              router.replace("/dashboard");
              router.refresh();
            });
          }}
        >
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={pending || booting}
            style={{ width: "100%", padding: "0.72rem", marginTop: "0.25rem" }}
          >
            {pending || booting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
