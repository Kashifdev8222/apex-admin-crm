import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { TxStatusActions } from "@/components/TxStatusActions";
import { TruncateTip } from "@/components/TruncateTip";
import { prisma } from "@/lib/prisma";
import { fmtDate, money } from "@/lib/format";
import { displayComment, displayRejectReason } from "@/lib/tx-display";
import { deleteTransaction, updateDepositStatus } from "@/app/actions";

export default async function DepositsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tenant?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status?.trim() || "";
  const tenant = sp.tenant?.trim() || "";

  const [tenants, rows] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, slug: true, name: true },
    }),
    prisma.transaction.findMany({
      where: {
        type: "DEPOSIT",
        ...(status ? { status: status as never } : {}),
        ...(tenant ? { tenantId: tenant } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        status: true,
        amount: true,
        currency: true,
        comment: true,
        note: true,
        paymentMethod: true,
        payCurrency: true,
        createdAt: true,
        client: { select: { id: true, email: true, firstName: true, lastName: true } },
        tenant: { select: { slug: true } },
      },
    }),
  ]);

  return (
    <>
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
          <h2>{rows.length} Deposits</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="sr-col">#</th>
                <th>Client</th>
                <th>Tenant</th>
                <th>Amount</th>
                <th>Comment</th>
                <th>Rejection Reason</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, i) => (
                <tr key={t.id}>
                  <td className="sr-col">{i + 1}</td>
                  <td>
                    <Link href={`/clients/${t.client.id}`} className="cap">
                      {t.client.firstName} {t.client.lastName}
                    </Link>
                    <div className="muted">{t.client.email}</div>
                  </td>
                  <td>{t.tenant.slug}</td>
                  <td>{money(Number(t.amount), t.currency)}</td>
                  <td>
                    <TruncateTip text={displayComment(t)} max={32} />
                  </td>
                  <td>
                    <TruncateTip text={displayRejectReason(t)} max={24} />
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
                  <td>{fmtDate(t.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <TxStatusActions
                        id={t.id}
                        currentStatus={t.status}
                        action={updateDepositStatus}
                      />
                      <ConfirmDeleteButton
                        action={deleteTransaction}
                        id={t.id}
                        confirmText="Delete this deposit permanently?"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
