"use client";

import { useEffect, useState, useTransition } from "react";
import { loginAction } from "@/app/actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [hiding, setHiding] = useState(false);
  const [pending, start] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

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
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
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
