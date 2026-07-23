import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { TxStatusActions } from "@/components/TxStatusActions";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmtDate, money } from "@/lib/format";
import { deleteTransaction, updateWithdrawStatus } from "@/app/actions";

export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tenant?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const status = sp.status?.trim() || "";
  const tenant = sp.tenant?.trim() || "";

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true },
  });

  const rows = await prisma.transaction.findMany({
    where: {
      type: "WITHDRAW",
      ...(status ? { status: status as never } : {}),
      ...(tenant ? { tenantId: tenant } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      client: { select: { id: true, email: true, firstName: true, lastName: true } },
      tenant: { select: { slug: true } },
      account: { select: { name: true, externalLogin: true } },
      transactionSource: true,
    },
  });

  return (
    <AppShell user={user} title="Withdrawals">
      <form className="filters" method="get">
        <select name="status" defaultValue={status} aria-label="Status">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="COMPLETED">Completed</option>
          <option value="FAILED">Rejected</option>
          <option value="CANCELED">Canceled</option>
        </select>
        <select name="tenant" defaultValue={tenant} aria-label="Tenant">
          <option value="">All Tenants</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.slug})
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">
          Apply Filter
        </button>
      </form>

      <div className="panel">
        <div className="panel-head">
          <h2>{rows.length} Withdrawals</h2>
          <span className="muted">Reject / Cancel Refunds Held Balance</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Client</th>
                <th>Amount</th>
                <th>Comment</th>
                <th>Rejection Reason</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => {
                const comment = t.comment || "—";
                const reject =
                  String(t.status).toUpperCase() === "FAILED"
                    ? t.note || t.comment || "—"
                    : "—";
                return (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/clients/${t.client.id}`} className="cap">
                        {t.client.firstName} {t.client.lastName}
                      </Link>
                      <div className="muted">{t.client.email}</div>
                      <div className="muted">{t.tenant.slug}</div>
                    </td>
                    <td>{money(Number(t.amount), t.currency)}</td>
                    <td>{String(comment)}</td>
                    <td>{String(reject)}</td>
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
                    <td>{fmtDate(t.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <TxStatusActions
                          id={t.id}
                          currentStatus={t.status}
                          action={updateWithdrawStatus}
                        />
                        <ConfirmDeleteButton
                          action={deleteTransaction}
                          id={t.id}
                          confirmText="Delete this withdrawal permanently?"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
