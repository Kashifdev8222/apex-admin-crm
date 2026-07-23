import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmtDate, money } from "@/lib/format";
import { updateWithdrawStatus } from "@/app/actions";

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
        <select name="status" defaultValue={status}>
          <option value="">All statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="FAILED">FAILED</option>
          <option value="CANCELED">CANCELED</option>
        </select>
        <select name="tenant" defaultValue={tenant}>
          <option value="">All tenants</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.slug})
            </option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">
          Filter
        </button>
      </form>

      <div className="panel">
        <div className="panel-head">
          <h2>{rows.length} withdrawals</h2>
          <span className="muted">Fail/Cancel refunds held balance</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Client</th>
                <th>Tenant</th>
                <th>Amount</th>
                <th>Destination</th>
                <th>TP</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/clients/${t.client.id}`}>
                      {t.client.firstName} {t.client.lastName}
                    </Link>
                    <div className="muted">{t.client.email}</div>
                  </td>
                  <td>{t.tenant.slug}</td>
                  <td>{money(Number(t.amount), t.currency)}</td>
                  <td>
                    {t.transactionSource?.source || t.paymentMethod || "—"}
                    {t.transactionSource?.value ? (
                      <div className="muted">{t.transactionSource.value}</div>
                    ) : null}
                  </td>
                  <td>{t.account.externalLogin || t.tpNumber || "—"}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>{fmtDate(t.createdAt)}</td>
                  <td>
                    {t.status === "PENDING" || t.status === "PROCESSING" ? (
                      <div className="row-actions">
                        <form action={updateWithdrawStatus}>
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="status" value="COMPLETED" />
                          <button className="btn btn-ok btn-sm" type="submit">
                            Complete
                          </button>
                        </form>
                        <form action={updateWithdrawStatus}>
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="status" value="CANCELED" />
                          <button className="btn btn-bad btn-sm" type="submit">
                            Cancel
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
