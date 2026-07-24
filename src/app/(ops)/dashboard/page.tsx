import { Suspense } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/session";
import { getDashboardStats, getRecentTransactions } from "@/lib/dashboard-data";
import { capitalize, fmtDate, money } from "@/lib/format";

function StatsSkeleton() {
  return (
    <div className="stats">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="stat skeleton-block" style={{ minHeight: 88 }} />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return <div className="panel skeleton-block" style={{ minHeight: 260 }} />;
}

async function DashboardStatsBlock({ tenantSlug }: { tenantSlug: string }) {
  const s = await getDashboardStats();
  return (
    <>
      <div className="stats">
        <div className="stat">
          <div className="label">Clients</div>
          <div className="value">{s.clients}</div>
        </div>
        <div className="stat">
          <div className="label">Active Accounts</div>
          <div className="value">{s.accounts}</div>
        </div>
        <div className="stat tone-info">
          <div className="label">Open Tickets</div>
          <div className="value">{s.openTickets}</div>
        </div>
        <div className="stat">
          <div className="label">Tenants</div>
          <div className="value">{s.tenants}</div>
        </div>
      </div>
      <div className="stats">
        <div className="stat tone-warn">
          <div className="label">Pending Deposits</div>
          <div className="value">{s.pendingDeposits}</div>
        </div>
        <div className="stat tone-warn">
          <div className="label">Pending Withdrawals</div>
          <div className="value">{s.pendingWithdraws}</div>
        </div>
        <div className="stat tone-info">
          <div className="label">KYC To Review</div>
          <div className="value">{s.pendingKyc}</div>
        </div>
        <div className="stat tone-ok">
          <div className="label">Your Tenant</div>
          <div className="value sm">{tenantSlug}</div>
        </div>
      </div>
    </>
  );
}

async function RecentTxBlock() {
  const recentTx = await getRecentTransactions();
  return (
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
  );
}

/** Page shell returns immediately; stats/table stream in (no full-page wait). */
export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.firstName || "there";

  return (
    <>
      <div className="page-intro">
        <p>
          Welcome back, <strong className="cap">{firstName}</strong>. Here’s a
          quick view of your workspace ({user.homeTenantSlug}).
        </p>
      </div>

      <Suspense fallback={<><StatsSkeleton /><StatsSkeleton /></>}>
        <DashboardStatsBlock tenantSlug={user.homeTenantSlug} />
      </Suspense>

      <Suspense fallback={<TableSkeleton />}>
        <RecentTxBlock />
      </Suspense>
    </>
  );
}
