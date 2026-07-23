"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { SessionUser } from "@/lib/auth";
import { ProfileMenu } from "@/components/ProfileMenu";

const links = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 13h7V4H4v9Zm9 7h7V4h-7v16ZM4 20h7v-5H4v5Z" />
      </svg>
    ),
  },
  {
    href: "/clients",
    label: "Clients",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/accounts",
    label: "Trading Accounts",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </svg>
    ),
  },
  {
    href: "/deposits",
    label: "Deposits",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v12" />
        <path d="m7 10 5 5 5-5" />
        <path d="M5 21h14" />
      </svg>
    ),
  },
  {
    href: "/withdrawals",
    label: "Withdrawals",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 21V9" />
        <path d="m7 14 5-5 5 5" />
        <path d="M5 3h14" />
      </svg>
    ),
  },
  {
    href: "/kyc",
    label: "KYC",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 15h6M9 11h2" />
      </svg>
    ),
  },
  {
    href: "/tickets",
    label: "Tickets",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V8Z" />
      </svg>
    ),
  },
  {
    href: "/meetings",
    label: "Meetings",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    href: "/tenants",
    label: "Tenants",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 21h18" />
        <path d="M5 21V7l7-4 7 4v14" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
];

function titleFromPath(pathname: string) {
  const hit = links.find(
    (l) =>
      pathname === l.href ||
      (l.href !== "/dashboard" && pathname.startsWith(`${l.href}/`)),
  );
  if (hit) return hit.label;
  if (pathname.startsWith("/clients/")) return "Client Detail";
  if (pathname.startsWith("/tickets/")) return "Ticket Detail";
  return "Operations";
}

export function AppShell({
  user,
  title,
  children,
}: {
  user: SessionUser;
  title?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = title || titleFromPath(pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    links.forEach((l) => router.prefetch(l.href));
  }, [router]);

  function go(href: string) {
    if (href === pathname) return;
    setMenuOpen(false);
    start(() => router.push(href));
  }

  return (
    <div className="shell">
      <div
        className={`sidebar-backdrop${menuOpen ? " show" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />
      <aside className={`sidebar${menuOpen ? " open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>Apex Admin</strong>
            <span>ClientZone CRM</span>
          </div>
        </div>
        <nav className="nav">
          {links.map((l) => {
            const active =
              l.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === l.href || pathname.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                prefetch
                className={active ? "active" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  go(l.href);
                }}
              >
                <span className="nav-icon" aria-hidden>
                  {l.icon}
                </span>
                <span>{l.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="main">
        <div className={`route-progress${pending ? " on" : ""}`} />
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
            >
              Menu
            </button>
            <div>
              <h1>{pageTitle}</h1>
              <div className="meta">Operations Desk</div>
            </div>
          </div>
          <ProfileMenu user={user} />
        </header>
        <div className={`content${pending ? " navigating" : ""}`}>{children}</div>
      </div>
    </div>
  );
}
