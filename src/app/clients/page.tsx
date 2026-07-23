import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmtDate, money } from "@/lib/format";
import { deleteClient } from "@/app/actions";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tenant?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const tenant = sp.tenant?.trim() || "";

  const tenants = await prisma.tenant.findMany({
    orderBy: { name: "asc" },
    select: { id: true, slug: true, name: true },
  });

  const rows = await prisma.client.findMany({
    where: {
      ...(tenant ? { tenantId: tenant } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      tenant: { select: { slug: true, name: true } },
      accounts: {
        where: { isActive: true },
        select: { balance: true, currency: true },
      },
    },
  });

  return (
    <AppShell user={user} title="Clients">
      <form className="filters" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search Email, Name, Phone"
          aria-label="Search"
        />
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
          <h2>{rows.length} Clients</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Tenant</th>
                <th>Status</th>
                <th>Balance</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const bal = c.accounts.reduce((s, a) => s + Number(a.balance), 0);
                const cur = c.accounts[0]?.currency || "USD";
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/clients/${c.id}`} className="cap">
                        {c.firstName} {c.lastName}
                      </Link>
                    </td>
                    <td>{c.email}</td>
                    <td>{c.tenant.slug}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>{money(bal, cur)}</td>
                    <td>{fmtDate(c.createdAt)}</td>
                    <td>
                      <div className="row-actions">
                        <Link className="btn btn-soft btn-sm" href={`/clients/${c.id}`}>
                          Open
                        </Link>
                        <ConfirmDeleteButton
                          action={deleteClient}
                          id={c.id}
                          confirmText="Delete this client and all related data?"
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
