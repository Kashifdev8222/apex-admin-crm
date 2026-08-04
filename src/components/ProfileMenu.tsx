"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { logoutAction } from "@/app/actions";
import type { SessionUser } from "@/lib/auth";

export function ProfileMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const initials =
    `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
    user.email.slice(0, 2).toUpperCase();
  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function onLogout() {
    if (pending) return;
    start(async () => {
      try {
        await logoutAction();
      } catch {
        /* cookie may still be cleared */
      }
      window.location.assign("/login");
    });
  }

  return (
    <div className="profile-menu" ref={ref}>
      <button
        type="button"
        className="profile-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        title="Account"
      >
        <span className="profile-avatar">{initials}</span>
      </button>
      {open ? (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown__id">
            <div className="dd-avatar">{initials}</div>
            <div>
              <strong className="cap">{displayName}</strong>
              <span>{user.email}</span>
              <span className="cap">
                {user.role} · {user.homeTenantSlug}
              </span>
            </div>
          </div>
          <Link
            href="/tenants"
            className="profile-dropdown__link"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            My Profile
          </Link>
          <Link
            href="/activity"
            className="profile-dropdown__link"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            Audit Log
          </Link>
          <button
            className="profile-dropdown__logout"
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={onLogout}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {pending ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
