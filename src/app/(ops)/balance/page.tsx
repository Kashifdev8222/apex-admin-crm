import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { TxStatusActions } from "@/components/TxStatusActions";
import { prisma } from "@/lib/prisma";
import { fmtDate, money } from "@/lib/format";
import { updateDepositStatus, updateWithdrawStatus } from "@/app/actions";
import { getDashboardStats } from "@/lib/dashboard-data";

function fmtCompact(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return money(v, "USD");
}

export default async function BalancePage() {
  const [stats, pending] = await Promise.all([
    getDashboardStats(),
    prisma.transaction.findMany({
      where: { status: { in: ["PENDING", "PROCESSING"] } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        createdAt: true,
        client: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        tenant: { select: { slug: true } },
      },
    }),
  ]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Balance Control</h1>
          <div className="breadcrumb">
            Review pending money movements and platform balances
          </div>
        </div>
        <div className="btn-actions">
          <Link href="/deposits" className="btn btn-outline btn-sm">
            All deposits
          </Link>
          <Link href="/withdrawals" className="btn btn-outline btn-sm">
            All withdrawals
          </Link>
        </div>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="value">{fmtCompact(stats.aum)}</div>
          <div className="label">Platform AUM</div>
        </div>
        <div className="stat">
          <div className="value">{stats.pendingDeposits}</div>
          <div className="label">
            Pending in · {fmtCompact(stats.pendingDepositAmount)}
          </div>
        </div>
        <div className="stat">
          <div className="value">{stats.pendingWithdraws}</div>
          <div className="label">
            Pending out · {fmtCompact(stats.pendingWithdrawAmount)}
          </div>
        </div>
        <div className="stat">
          <div className="value">{stats.accounts}</div>
          <div className="label">Active trading accounts</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Pending requests</h2>
          <Link href="/transactions">View all transactions →</Link>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="sr-col">#</th>
                <th>Client</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Tenant</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={8} className="muted">
                    No pending deposits or withdrawals.
                  </td>
                </tr>
              ) : (
                pending.map((t, i) => (
                  <tr key={t.id}>
                    <td className="sr-col">{i + 1}</td>
                    <td>
                      <Link href={`/clients/${t.client.id}`} className="cap">
                        {t.client.firstName} {t.client.lastName}
                      </Link>
                      <div className="muted">{t.client.email}</div>
                    </td>
                    <td>{t.type === "DEPOSIT" ? "Deposit" : "Withdrawal"}</td>
                    <td
                      style={{
                        fontWeight: 600,
                        color: t.type === "DEPOSIT" ? "#16a34a" : "#ef4444",
                      }}
                    >
                      {t.type === "DEPOSIT" ? "+" : "-"}
                      {money(Number(t.amount), t.currency)}
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>{t.tenant.slug}</td>
                    <td>{fmtDate(t.createdAt)}</td>
                    <td>
                      <TxStatusActions
                        id={t.id}
                        currentStatus={t.status}
                        action={
                          t.type === "DEPOSIT"
                            ? updateDepositStatus
                            : updateWithdrawStatus
                        }
                      />
                    </td>
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
