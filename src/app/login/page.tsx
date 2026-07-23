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
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-mark">A</div>
          <div>
            <h1 style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
              Apex Admin
            </h1>
            <div className="muted" style={{ fontSize: "0.8rem" }}>
              Multi-tenant ClientZone CRM
            </div>
          </div>
        </div>
        <p>Sign in with your staff account to manage deposits, KYC, tickets, and more.</p>
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
              if (res && !res.ok) setError(res.error);
            });
          }}
        >
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue="admin@apex.ai"
              placeholder="admin@apex.ai"
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
            disabled={pending}
            style={{ width: "100%", padding: "0.8rem" }}
          >
            {pending ? "Signing In…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
