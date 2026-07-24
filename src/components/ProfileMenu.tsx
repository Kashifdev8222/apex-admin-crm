"use client";

import { useEffect, useRef, useState } from "react";
import { logoutAction } from "@/app/actions";
import type { SessionUser } from "@/lib/auth";

export function ProfileMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);
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
        <span className="profile-trigger__meta">
          <strong className="cap">{displayName}</strong>
          <span className="cap">{user.role}</span>
        </span>
      </button>
      {open ? (
        <div className="profile-dropdown" role="menu">
          <div className="profile-dropdown__id">
            <strong className="cap">{displayName}</strong>
            <span>{user.email}</span>
            <span className="cap">
              {user.role} · {user.homeTenantSlug}
            </span>
          </div>
          <form action={logoutAction}>
            <button className="profile-dropdown__logout" type="submit" role="menuitem">
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
