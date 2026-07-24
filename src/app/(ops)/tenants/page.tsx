import { StatusBadge } from "@/components/StatusBadge";
import { EditRowModal } from "@/components/EditRowModal";
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

      <div className="panel">
        <div className="panel-head">
          <h2>{rows.length} Tenants</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>MT Group</th>
                <th>Leverage</th>
                <th>Clients</th>
                <th>Accounts</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.slug}</td>
                  <td>
                    <code className="mono-cell">{t.defaultMtGroup}</code>
                  </td>
                  <td>{t.defaultLeverage}</td>
                  <td>{t._count.clients}</td>
                  <td>{t._count.accounts}</td>
                  <td>
                    <StatusBadge status={t.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td>{fmtDate(t.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <EditRowModal
                        title={`Edit · ${t.name}`}
                        action={updateTenant}
                        hidden={{ id: t.id }}
                        fields={[
                          {
                            name: "name",
                            label: "Name",
                            defaultValue: t.name,
                            required: true,
                          },
                          {
                            name: "defaultMtGroup",
                            label: "MT group",
                            defaultValue: t.defaultMtGroup,
                            required: true,
                          },
                          {
                            name: "defaultLeverage",
                            label: "Leverage",
                            type: "number",
                            defaultValue: t.defaultLeverage,
                          },
                          {
                            name: "isActive",
                            label: "Status",
                            type: "select",
                            defaultValue: t.isActive ? "true" : "false",
                            options: [
                              { value: "true", label: "Active" },
                              { value: "false", label: "Inactive" },
                            ],
                          },
                        ]}
                      />
                      <form action={updateTenant}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="name" value={t.name} />
                        <input type="hidden" name="defaultMtGroup" value={t.defaultMtGroup} />
                        <input
                          type="hidden"
                          name="defaultLeverage"
                          value={String(t.defaultLeverage)}
                        />
                        <input
                          type="hidden"
                          name="isActive"
                          value={t.isActive ? "false" : "true"}
                        />
                        <button className="btn btn-soft btn-sm" type="submit">
                          {t.isActive ? "Disable" : "Enable"}
                        </button>
                      </form>
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
