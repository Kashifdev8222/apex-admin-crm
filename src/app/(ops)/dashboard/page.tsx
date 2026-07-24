import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { capitalize, fmtDate, money } from "@/lib/format";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await requireUser();

  const [counts, recentTx] = await Promise.all([
    prisma.$transaction([
      prisma.tenant.count(),
      prisma.client.count(),
      prisma.tradingAccount.count({ where: { isActive: true } }),
      prisma.ticket.count({
        where: { status: { in: ["New", "Open", "Pending", "In Progress"] } },
      }),
      prisma.transaction.count({
        where: { type: "DEPOSIT", status: { in: ["PENDING", "PROCESSING"] } },
      }),
      prisma.transaction.count({
        where: { type: "WITHDRAW", status: { in: ["PENDING", "PROCESSING"] } },
      }),
      prisma.kycDocument.count({ where: { status: "PENDING" } }),
    ]),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        createdAt: true,
        client: { select: { email: true, firstName: true, lastName: true } },
        tenant: { select: { slug: true } },
      },
    }),
  ]);

  const [
    tenants,
    clients,
    accounts,
    openTickets,
    pendingDeposits,
    pendingWithdraws,
    pendingKyc,
  ] = counts;

  const firstName = user.firstName || "there";

  return (
    <>
      <div className="page-intro">
        <p>
          Welcome back, <strong className="cap">{firstName}</strong>. Here’s a
          quick view of your workspace ({user.homeTenantSlug}).
        </p>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="label">Clients</div>
          <div className="value">{clients}</div>
        </div>
        <div className="stat">
          <div className="label">Active Accounts</div>
          <div className="value">{accounts}</div>
        </div>
        <div className="stat tone-info">
          <div className="label">Open Tickets</div>
          <div className="value">{openTickets}</div>
        </div>
        <div className="stat">
          <div className="label">Tenants</div>
          <div className="value">{tenants}</div>
        </div>
      </div>

      <div className="stats">
        <div className="stat tone-warn">
          <div className="label">Pending Deposits</div>
          <div className="value">{pendingDeposits}</div>
        </div>
        <div className="stat tone-warn">
          <div className="label">Pending Withdrawals</div>
          <div className="value">{pendingWithdraws}</div>
        </div>
        <div className="stat tone-info">
          <div className="label">KYC To Review</div>
          <div className="value">{pendingKyc}</div>
        </div>
        <div className="stat tone-ok">
          <div className="label">Your Tenant</div>
          <div className="value sm">{user.homeTenantSlug}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Recent Transactions</h2>
          <Link href="/deposits">View deposits →</Link>
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
                    <td>{capitalize(t.type)}</td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>{money(Number(t.amount), t.currency)}</td>
                    <td>
                      <span className="cap">
                        {t.client.firstName} {t.client.lastName}
                      </span>
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
    </>
  );
}
