"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { logoutAction } from "@/app/actions";
import type { SessionUser } from "@/lib/auth";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/accounts", label: "Trading Accounts" },
  { href: "/deposits", label: "Deposits" },
  { href: "/withdrawals", label: "Withdrawals" },
  { href: "/kyc", label: "KYC" },
  { href: "/tickets", label: "Tickets" },
  { href: "/meetings", label: "Meetings" },
  { href: "/tenants", label: "Tenants" },
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
    start(() => {
      router.push(href);
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
          <strong>Apex Admin CRM</strong>
          <span>All ClientZones · Direct DB</span>
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
                {l.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction}>
          <button className="btn btn-ghost" type="submit" style={{ width: "100%" }}>
            Log Out
          </button>
        </form>
      </aside>

      <div className="main">
        <div className={`route-progress${pending ? " on" : ""}`} />
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
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
              <div className="meta">Cross-Tenant Operations Desk</div>
            </div>
          </div>
          <div className="meta" style={{ textAlign: "right" }}>
            <div className="cap">
              {user.firstName} {user.lastName}
            </div>
            <div>
              {user.email} · <span className="cap">{user.role}</span> ·{" "}
              {user.homeTenantSlug}
            </div>
          </div>
        </header>
        <div className={`content${pending ? " navigating" : ""}`}>{children}</div>
      </div>
    </div>
  );
}
