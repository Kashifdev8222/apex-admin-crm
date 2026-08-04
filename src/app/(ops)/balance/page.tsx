import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { TxStatusActions } from "@/components/TxStatusActions";
import { prisma } from "@/lib/prisma";
import { fmtDate, money } from "@/lib/format";
import {
  adjustUserBalance,
  updateDepositStatus,
  updateWithdrawStatus,
} from "@/app/actions";
import { getDashboardStats } from "@/lib/dashboard-data";

function fmtCompact(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return money(v, "USD");
}

export default async function BalancePage() {
  const [stats, pending, accounts, marginAgg] = await Promise.all([
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
        paymentMethod: true,
        createdAt: true,
        client: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        tenant: { select: { slug: true } },
      },
    }),
    prisma.tradingAccount.findMany({
      where: { isActive: true, isDemoAccount: false },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        balance: true,
        currency: true,
        externalLogin: true,
        client: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.tradingAccount.aggregate({ _sum: { margin: true } }),
  ]);

  const marginPct =
    stats.aum > 0
      ? (Number(marginAgg._sum.margin || 0) / stats.aum) * 100
      : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Balance Control</h1>
          <div className="breadcrumb">
            <a href="/dashboard">Admin</a> / Balance
          </div>
        </div>
      </div>

      <div className="kpi-strip-4">
        <div className="kpi-card">
          <div className="kpi-lbl">Total AUM</div>
          <div className="kpi-val">{fmtCompact(stats.aum)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Pending deposits</div>
          <div className="kpi-val">{fmtCompact(stats.pendingDepositAmount)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Pending withdrawals</div>
          <div className="kpi-val">{fmtCompact(stats.pendingWithdrawAmount)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Margin usage</div>
          <div className="kpi-val">{marginPct.toFixed(1)}%</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Adjust user balance</h2>
        </div>
        <div className="panel-body">
          <form action={adjustUserBalance} className="adjust-grid">
            <div className="field">
              <label className="form-label">User</label>
              <select className="input" name="accountId" required defaultValue="">
                <option value="" disabled>
                  Select user…
                </option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.client.firstName} {a.client.lastName} ·{" "}
                    {money(Number(a.balance), a.currency)}
                    {a.externalLogin ? ` · ${a.externalLogin}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label className="form-label">Operation</label>
              <select className="input" name="operation" defaultValue="credit">
                <option value="credit">Credit (+)</option>
                <option value="debit">Debit (−)</option>
                <option value="set">Set exact</option>
              </select>
            </div>
            <div className="field">
              <label className="form-label">Amount</label>
              <input
                className="input"
                type="number"
                name="amount"
                placeholder="0.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>
            <div className="field">
              <label className="form-label">Reason</label>
              <select className="input" name="reason" defaultValue="Bonus">
                <option>Bonus</option>
                <option>Correction</option>
                <option>Fee waiver</option>
                <option>Refund</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">
              Apply
            </button>
          </form>
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
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No pending deposits or withdrawals.
                  </td>
                </tr>
              ) : (
                pending.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>
                      <Link href={`/clients/${t.client.id}`} className="cap">
                        {t.client.firstName} {t.client.lastName}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          t.type === "DEPOSIT" ? "badge-blue" : "badge-amber"
                        }`}
                      >
                        {t.type === "DEPOSIT" ? "Deposit" : "Withdraw"}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {money(Number(t.amount), t.currency)}
                    </td>
                    <td>{t.paymentMethod || "—"}</td>
                    <td>{fmtDate(t.createdAt)}</td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="actions-col">
                      <div className="btn-actions">
                        <TxStatusActions
                          id={t.id}
                          currentStatus={t.status}
                          action={
                            t.type === "DEPOSIT"
                              ? updateDepositStatus
                              : updateWithdrawStatus
                          }
                        />
                      </div>
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
