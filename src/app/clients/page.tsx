import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmtDate, money } from "@/lib/format";

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
        <input name="q" defaultValue={q} placeholder="Search email, name, phone" />
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
          <h2>{rows.length} clients</h2>
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
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const bal = c.accounts.reduce((s, a) => s + Number(a.balance), 0);
                const cur = c.accounts[0]?.currency || "USD";
                return (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/clients/${c.id}`}>
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
