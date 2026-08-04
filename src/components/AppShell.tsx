"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type ReactNode } from "react";
import type { SessionUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions";
import { ProfileMenu } from "@/components/ProfileMenu";
import {
  NotificationsBell,
  type NotifItem,
} from "@/components/NotificationsBell";

type NavItem = { href: string; label: string; icon: ReactNode };

const dashboard: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 7h8v-8h-8v8z" />
      </svg>
    ),
  },
];

const management: NavItem[] = [
  {
    href: "/clients",
    label: "User Management",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/balance",
    label: "Balance Control",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    href: "/transactions",
    label: "Transactions",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    ),
  },
  {
    href: "/ai-control",
    label: "AI Control Panel",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 9h6M9 15h6M9 12h6" />
      </svg>
    ),
  },
  {
    href: "/accounts",
    label: "Trading Accounts",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
  },
];

const compliance: NavItem[] = [
  {
    href: "/kyc",
    label: "KYC & Documents",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M9 13h6M9 17h4" />
      </svg>
    ),
  },
  {
    href: "/tickets",
    label: "Support Tickets",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const system: NavItem[] = [
  {
    href: "/tenants",
    label: "Platform Settings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
  },
  {
    href: "/activity",
    label: "Activity Log",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    href: "/payments",
    label: "Payment Methods",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    href: "/staff",
    label: "Staff Users",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3" />
        <path d="M22 11v6M19 14h6" />
      </svg>
    ),
  },
  {
    href: "/departments",
    label: "Departments",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7h18M3 12h18M3 17h18" />
      </svg>
    ),
  },
  {
    href: "/meetings",
    label: "Meetings",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
];

const allLinks = [...dashboard, ...management, ...compliance, ...system];

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/clients": "User Management",
  "/balance": "Balance Control",
  "/transactions": "Transactions",
  "/ai-control": "AI Control Panel",
  "/deposits": "Deposits",
  "/withdrawals": "Withdrawals",
  "/accounts": "Trading Accounts",
  "/payments": "Payment Methods",
  "/kyc": "KYC & Documents",
  "/tickets": "Support Tickets",
  "/meetings": "Meetings",
  "/tenants": "Platform Settings",
  "/staff": "Staff Users",
  "/departments": "Departments",
  "/activity": "Activity Log",
};

function titleFromPath(pathname: string) {
  if (titles[pathname]) return titles[pathname];
  if (pathname.startsWith("/clients/")) return "User Portfolio";
  if (pathname.startsWith("/tickets/")) return "Ticket Detail";
  const hit = allLinks.find(
    (l) =>
      pathname === l.href ||
      (l.href !== "/dashboard" && pathname.startsWith(`${l.href}/`)),
  );
  return hit?.label || "Operations";
}

function NavGroup({
  label,
  items,
  pathname,
  onGo,
}: {
  label?: string;
  items: NavItem[];
  pathname: string;
  onGo: (href: string) => void;
}) {
  return (
    <div className="nav-group">
      {label ? <div className="nav-group__label">{label}</div> : null}
      {items.map((l) => {
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
              onGo(l.href);
            }}
          >
            <span className="nav-icon" aria-hidden>
              {l.icon}
            </span>
            <span>{l.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function AppShell({
  user,
  notifications = [],
  children,
}: {
  user: SessionUser;
  notifications?: NotifItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pageTitle = titleFromPath(pathname);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    allLinks.forEach((l) => router.prefetch(l.href));
  }, [router]);

  function go(href: string) {
    if (href === pathname) return;
    setMenuOpen(false);
    start(() => router.push(href));
  }

  function onSignOut() {
    if (signingOut) return;
    setSigningOut(true);
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
    <div className="shell">
      <div
        className={`sidebar-backdrop${menuOpen ? " show" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />
      <aside className={`sidebar${menuOpen ? " open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden />
          <strong>TradeScope Admin</strong>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav className="nav">
          <NavGroup items={dashboard} pathname={pathname} onGo={go} />
          <NavGroup label="Management" items={management} pathname={pathname} onGo={go} />
          <NavGroup label="Compliance" items={compliance} pathname={pathname} onGo={go} />
          <NavGroup label="System" items={system} pathname={pathname} onGo={go} />
        </nav>
        <div className="sidebar-bottom">
          <button
            type="button"
            className="sidebar-signout"
            onClick={onSignOut}
            disabled={signingOut || pending}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </aside>

      <div className="main">
        <div className={`route-progress${pending ? " on" : ""}`} aria-hidden />
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Open menu"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <h1>{pageTitle}</h1>
          </div>
          <div className="topbar-actions">
            <NotificationsBell items={notifications} />
            <ProfileMenu user={user} />
          </div>
        </header>
        <div className={`content${pending ? " navigating" : ""}`}>
          <div className="content-inner">{children}</div>
        </div>
      </div>
    </div>
  );
}
