import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { TxStatusActions } from "@/components/TxStatusActions";
import { TruncateTip } from "@/components/TruncateTip";
import { prisma } from "@/lib/prisma";
import { capitalize, fmtDate, money } from "@/lib/format";
import { displayComment, displayRejectReason } from "@/lib/tx-display";
import {
  deleteTransaction,
  updateDepositStatus,
  updateWithdrawStatus,
} from "@/app/actions";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    status?: string;
    tenant?: string;
  }>;
}) {
  const sp = await searchParams;
  const type = sp.type?.trim() || "";
  const status = sp.status?.trim() || "";
  const tenant = sp.tenant?.trim() || "";

  const [tenants, rows] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.transaction.findMany({
      where: {
        ...(type === "DEPOSIT" || type === "WITHDRAW" || type === "ADJUSTMENT"
          ? { type }
          : {}),
        ...(status ? { status: status as never } : {}),
        ...(tenant ? { tenantId: tenant } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 150,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        comment: true,
        note: true,
        paymentMethod: true,
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
          <h1>Transactions</h1>
          <div className="breadcrumb">All deposits, withdrawals, and adjustments</div>
        </div>
        <div className="btn-actions">
          <Link href="/deposits" className="btn btn-outline btn-sm">
            Deposits only
          </Link>
          <Link href="/withdrawals" className="btn btn-outline btn-sm">
            Withdrawals only
          </Link>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>All transactions</h2>
          <form className="filter-row" method="get" style={{ margin: 0 }}>
            <select name="type" defaultValue={type} aria-label="Type">
              <option value="">All types</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="WITHDRAW">Withdrawal</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
            <select name="status" defaultValue={status} aria-label="Status">
              <option value="">All status</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Rejected</option>
              <option value="CANCELED">Canceled</option>
            </select>
            <select name="tenant" defaultValue={tenant} aria-label="Tenant">
              <option value="">All tenants</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" type="submit">
              Apply
            </button>
          </form>
        </div>
        <div className="panel-body nopad">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="sr-col">#</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Method</th>
                  <th>Note</th>
                  <th>Tenant</th>
                  <th>Created</th>
                  <th className="actions-col" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="muted">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  rows.map((t, i) => {
                    const action =
                      t.type === "DEPOSIT"
                        ? updateDepositStatus
                        : t.type === "WITHDRAW"
                          ? updateWithdrawStatus
                          : null;
                    const st = String(t.status).toUpperCase();
                    const showDelete = st !== "COMPLETED";
                    return (
                      <tr key={t.id}>
                        <td className="sr-col">{i + 1}</td>
                        <td>
                          <Link href={`/clients/${t.client.id}`} className="cap" style={{ fontWeight: 500 }}>
                            {t.client.firstName} {t.client.lastName}
                          </Link>
                          <div className="muted">{t.client.email}</div>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              t.type === "DEPOSIT"
                                ? "badge-blue"
                                : t.type === "WITHDRAW"
                                  ? "badge-amber"
                                  : "neutral"
                            }`}
                          >
                            {capitalize(t.type)}
                          </span>
                        </td>
                        <td
                          style={{
                            fontWeight: 600,
                            color:
                              t.type === "DEPOSIT"
                                ? "#10b981"
                                : t.type === "WITHDRAW"
                                  ? "#ef4444"
                                  : undefined,
                          }}
                        >
                          {t.type === "DEPOSIT" ? "+" : t.type === "WITHDRAW" ? "-" : ""}
                          {money(Number(t.amount), t.currency)}
                        </td>
                        <td>
                          <StatusBadge
                            status={
                              t.status === "FAILED"
                                ? "Rejected"
                                : t.status === "CANCELED"
                                  ? "Canceled"
                                  : t.status
                            }
                          />
                        </td>
                        <td>{t.paymentMethod || "—"}</td>
                        <td>
                          <TruncateTip
                            text={
                              displayRejectReason(t) !== "—"
                                ? displayRejectReason(t)
                                : displayComment(t)
                            }
                          />
                        </td>
                        <td>{t.tenant.slug}</td>
                        <td>{fmtDate(t.createdAt)}</td>
                        <td className="actions-col">
                          <div className="btn-actions">
                            {action ? (
                              <TxStatusActions
                                id={t.id}
                                currentStatus={t.status}
                                action={action}
                              />
                            ) : (
                              <span className="btn btn-ghost btn-xs">View</span>
                            )}
                            {showDelete ? (
                              <ConfirmDeleteButton
                                id={t.id}
                                action={deleteTransaction}
                                label="Delete"
                                className="btn btn-danger btn-xs"
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
