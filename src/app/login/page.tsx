"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/app/actions";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 style={{ fontFamily: "var(--font-display), Georgia, serif" }}>
          Apex Admin CRM
        </h1>
        <p>Sign in with a staff account. One panel for all ClientZones.</p>
        {error ? <div className="error">{error}</div> : null}
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
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
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
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={pending} style={{ width: "100%" }}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
