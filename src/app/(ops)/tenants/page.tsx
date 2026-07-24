import { StatusBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { updateTenant } from "@/app/actions";

export default async function TenantsPage() {
  const rows = await prisma.tenant.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          clients: true,
          accounts: true,
          transactions: true,
          tickets: true,
          staffUsers: true,
        },
      },
    },
  });

  return (
    <>
      <div className="page-intro">
        <p>Tenant (ClientZone) settings: name, MT group, leverage, and active flag.</p>
      </div>

      <div className="stack">
        {rows.map((t) => (
          <div key={t.id} className="panel">
            <div className="panel-head">
              <h2>
                {t.name}{" "}
                <span className="muted" style={{ fontWeight: 500, fontSize: "0.85rem" }}>
                  ({t.slug})
                </span>
              </h2>
              <StatusBadge status={t.isActive ? "ACTIVE" : "INACTIVE"} />
            </div>
            <div style={{ padding: "1rem" }}>
              <p className="muted" style={{ marginTop: 0 }}>
                Clients {t._count.clients} · Accounts {t._count.accounts} · Tx{" "}
                {t._count.transactions} · Tickets {t._count.tickets} · Staff{" "}
                {t._count.staffUsers} · Created {fmtDate(t.createdAt)}
              </p>
              <form action={updateTenant} className="filters">
                <input type="hidden" name="id" value={t.id} />
                <input name="name" defaultValue={t.name} required aria-label="Name" />
                <input
                  name="defaultMtGroup"
                  defaultValue={t.defaultMtGroup}
                  placeholder="MT group"
                  aria-label="MT group"
                  style={{ minWidth: 200 }}
                />
                <input
                  name="defaultLeverage"
                  type="number"
                  defaultValue={t.defaultLeverage}
                  aria-label="Leverage"
                  style={{ minWidth: 100 }}
                />
                <select name="isActive" defaultValue={t.isActive ? "true" : "false"}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
                <button className="btn btn-primary" type="submit">
                  Save
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
