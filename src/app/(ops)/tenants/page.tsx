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
              {rows.map((t) => {
                const formId = `tenant-${t.id}`;
                return (
                  <tr key={t.id}>
                    <td>
                      <input
                        form={formId}
                        name="name"
                        defaultValue={t.name}
                        required
                        aria-label="Name"
                        className="table-input"
                      />
                    </td>
                    <td>{t.slug}</td>
                    <td>
                      <input
                        form={formId}
                        name="defaultMtGroup"
                        defaultValue={t.defaultMtGroup}
                        aria-label="MT group"
                        className="table-input"
                        style={{ minWidth: 160 }}
                      />
                    </td>
                    <td>
                      <input
                        form={formId}
                        name="defaultLeverage"
                        type="number"
                        defaultValue={t.defaultLeverage}
                        aria-label="Leverage"
                        className="table-input table-input--sm"
                      />
                    </td>
                    <td>{t._count.clients}</td>
                    <td>{t._count.accounts}</td>
                    <td>
                      <div className="row-actions">
                        <select
                          form={formId}
                          name="isActive"
                          defaultValue={t.isActive ? "true" : "false"}
                          aria-label="Active"
                          className="table-input"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                        <StatusBadge status={t.isActive ? "ACTIVE" : "INACTIVE"} />
                      </div>
                    </td>
                    <td>{fmtDate(t.createdAt)}</td>
                    <td>
                      <form id={formId} action={updateTenant}>
                        <input type="hidden" name="id" value={t.id} />
                        <button className="btn btn-soft btn-sm" type="submit">
                          Save
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
