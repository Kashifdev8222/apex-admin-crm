"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type NotifItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: string;
  when: string;
};

export function NotificationsBell({ items }: { items: NotifItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="notif-dd-wrap" ref={ref}>
      <button
        type="button"
        className="header-icon-btn"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z" />
        </svg>
        {items.length > 0 ? <span className="dot" /> : null}
      </button>
      {open ? (
        <div className="notif-dropdown" role="menu">
          {items.length === 0 ? (
            <div className="notif-item" style={{ cursor: "default" }}>
              <div>
                <strong>All caught up</strong>
                <span className="notif-time">No pending alerts</span>
              </div>
            </div>
          ) : (
            items.map((n) => (
              <Link
                key={n.id}
                href={n.href}
                className="notif-item"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <div className="notif-dot" style={{ background: n.tone }} />
                <div>
                  <strong>{n.title}</strong> — {n.detail}
                  <span className="notif-time">{n.when}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
