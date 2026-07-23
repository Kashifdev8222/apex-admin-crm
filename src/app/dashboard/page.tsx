import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmtDate, money } from "@/lib/format";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();

  const [
    tenants,
    clients,
    accounts,
    pendingDeposits,
    pendingWithdraws,
    pendingKyc,
    openTickets,
    recentTx,
  ] = await Promise.all([
    prisma.tenant.count(),
    prisma.client.count(),
    prisma.tradingAccount.count({ where: { isActive: true } }),
    prisma.transaction.count({
      where: { type: "DEPOSIT", status: { in: ["PENDING", "PROCESSING"] } },
    }),
    prisma.transaction.count({
      where: { type: "WITHDRAW", status: { in: ["PENDING", "PROCESSING"] } },
    }),
    prisma.kycDocument.count({ where: { status: "PENDING" } }),
    prisma.ticket.count({
      where: { status: { in: ["New", "Open", "Pending", "In Progress"] } },
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        client: { select: { email: true, firstName: true, lastName: true } },
        tenant: { select: { slug: true, name: true } },
      },
    }),
  ]);

  return (
    <AppShell user={user} title="Dashboard">
      <div className="stats">
        <div className="stat">
          <div className="label">Tenants</div>
          <div className="value">{tenants}</div>
        </div>
        <div className="stat">
          <div className="label">Clients</div>
          <div className="value">{clients}</div>
        </div>
        <div className="stat">
          <div className="label">Active accounts</div>
          <div className="value">{accounts}</div>
        </div>
        <div className="stat">
          <div className="label">Open tickets</div>
          <div className="value">{openTickets}</div>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="label">Pending deposits</div>
          <div className="value">{pendingDeposits}</div>
        </div>
        <div className="stat">
          <div className="label">Pending withdrawals</div>
          <div className="value">{pendingWithdraws}</div>
        </div>
        <div className="stat">
          <div className="label">KYC to review</div>
          <div className="value">{pendingKyc}</div>
        </div>
        <div className="stat">
          <div className="label">Staff home</div>
          <div className="value" style={{ fontSize: "1.05rem" }}>
            {user.homeTenantSlug}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Recent transactions</h2>
          <Link href="/deposits" className="muted">
            Manage deposits →
          </Link>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Client</th>
                <th>Tenant</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {recentTx.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No transactions yet.
                  </td>
                </tr>
              ) : (
                recentTx.map((t) => (
                  <tr key={t.id}>
                    <td>{t.type}</td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>{money(Number(t.amount), t.currency)}</td>
                    <td>
                      {t.client.firstName} {t.client.lastName}
                      <div className="muted">{t.client.email}</div>
                    </td>
                    <td>{t.tenant.slug}</td>
                    <td>{fmtDate(t.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
