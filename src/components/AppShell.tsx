"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function AppShell({
  user,
  title,
  children,
}: {
  user: SessionUser;
  title: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="shell">
      <aside className="sidebar">
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
                className={active ? "active" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction}>
          <button className="btn btn-ghost" type="submit" style={{ width: "100%" }}>
            Log out
          </button>
        </form>
      </aside>
      <div className="main">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <div className="meta">Cross-tenant operations desk</div>
          </div>
          <div className="meta" style={{ textAlign: "right" }}>
            <div>
              {user.firstName} {user.lastName}
            </div>
            <div>
              {user.email} · {user.role} · {user.homeTenantSlug}
            </div>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
