"use client";

import { useEffect, useState, useTransition } from "react";
import { loginAction } from "@/app/actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [hiding, setHiding] = useState(false);
  const [pending, start] = useTransition();

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
      {pending && (
        <div className="boot-overlay" aria-live="polite">
          <div className="boot-card">
            <div className="boot-spinner" />
            <strong>Signing in…</strong>
            <span>One moment</span>
          </div>
        </div>
      )}
      <div className="login-shell">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-mark">A</div>
            <div>
              <h1>Apex Admin</h1>
              <div className="login-sub">Operations CRM · Staff access</div>
            </div>
          </div>
          <p className="login-lead">
            Sign in to manage clients, deposits, KYC, tickets, and more.
          </p>
          {error ? (
            <div className={`error${hiding ? " hiding" : ""}`} role="alert">
              {error}
            </div>
          ) : null}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setError(null);
              start(async () => {
                const res = await loginAction(fd);
                if (!res || !res.ok) {
                  setError(res && "error" in res ? res.error : "Login failed");
                  return;
                }
                // Hard navigate is faster than soft RSC dashboard load
                window.location.assign("/dashboard");
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
                autoFocus
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
              className="btn btn-primary btn-login"
              type="submit"
              disabled={pending}
            >
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
