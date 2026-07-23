import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmtDate, money } from "@/lib/format";
import { deleteAccount } from "@/app/actions";
import Link from "next/link";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const tenant = sp.tenant?.trim() || "";

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true },
  });

  const rows = await prisma.tradingAccount.findMany({
    where: tenant ? { tenantId: tenant } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      client: { select: { id: true, email: true, firstName: true, lastName: true } },
      tenant: { select: { slug: true } },
    },
  });

  return (
    <AppShell user={user} title="Trading Accounts">
      <form className="filters" method="get">
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
          <h2>{rows.length} Accounts</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>TP / Login</th>
                <th>Name</th>
                <th>Client</th>
                <th>Tenant</th>
                <th>Balance</th>
                <th>Equity</th>
                <th>Active</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>{a.externalLogin || "—"}</td>
                  <td className="cap">{a.name}</td>
                  <td>
                    <Link href={`/clients/${a.client.id}`} className="cap">
                      {a.client.firstName} {a.client.lastName}
                    </Link>
                    <div className="muted">{a.client.email}</div>
                  </td>
                  <td>{a.tenant.slug}</td>
                  <td>{money(Number(a.balance), a.currency)}</td>
                  <td>{money(Number(a.equity), a.currency)}</td>
                  <td>
                    <StatusBadge status={a.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td>{fmtDate(a.updatedAt)}</td>
                  <td>
                    <ConfirmDeleteButton
                      action={deleteAccount}
                      id={a.id}
                      confirmText="Delete this trading account and its transactions?"
                    />
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
