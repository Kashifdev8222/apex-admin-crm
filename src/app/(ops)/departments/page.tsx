import { StatusBadge } from "@/components/StatusBadge";
import { EditRowModal } from "@/components/EditRowModal";
import { prisma } from "@/lib/prisma";
import { createDepartment, updateDepartment } from "@/app/actions";

export default async function DepartmentsPage() {
  const [tenants, rows] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.ticketDepartment.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        tenant: { select: { slug: true, name: true } },
        _count: { select: { tickets: true } },
      },
    }),
  ]);

  return (
    <>
      <div className="page-intro">
        <p>Create and manage support departments used when clients open tickets.</p>
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <div className="panel-head">
          <h2>Add Department</h2>
        </div>
        <form action={createDepartment} className="filters" style={{ padding: "1rem" }}>
          <input name="name" required placeholder="Department name" aria-label="Name" />
          <select name="tenantId" required aria-label="Tenant" defaultValue={tenants[0]?.id || ""}>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.slug})
              </option>
            ))}
          </select>
          <input
            name="sortOrder"
            type="number"
            defaultValue={0}
            placeholder="Sort"
            aria-label="Sort order"
            style={{ minWidth: 90 }}
          />
          <button className="btn btn-primary" type="submit">
            Create
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>{rows.length} Departments</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="sr-col">#</th>
                <th>Name</th>
                <th>Tenant</th>
                <th>Tickets</th>
                <th>Sort</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No departments yet. Create one above.
                  </td>
                </tr>
              ) : (
                rows.map((d, i) => (
                  <tr key={d.id}>
                    <td className="sr-col">{i + 1}</td>
                    <td>{d.name}</td>
                    <td>{d.tenant.slug}</td>
                    <td>{d._count.tickets}</td>
                    <td>{d.sortOrder}</td>
                    <td>
                      <StatusBadge status={d.isActive ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <EditRowModal
                          title={`Edit · ${d.name}`}
                          action={updateDepartment}
                          hidden={{ id: d.id }}
                          fields={[
                            {
                              name: "name",
                              label: "Name",
                              defaultValue: d.name,
                              required: true,
                            },
                            {
                              name: "sortOrder",
                              label: "Sort order",
                              type: "number",
                              defaultValue: d.sortOrder,
                            },
                            {
                              name: "isActive",
                              label: "Status",
                              type: "select",
                              defaultValue: d.isActive ? "true" : "false",
                              options: [
                                { value: "true", label: "Active" },
                                { value: "false", label: "Inactive" },
                              ],
                            },
                          ]}
                        />
                        <form action={updateDepartment}>
                          <input type="hidden" name="id" value={d.id} />
                          <input type="hidden" name="name" value={d.name} />
                          <input type="hidden" name="sortOrder" value={String(d.sortOrder)} />
                          <input
                            type="hidden"
                            name="isActive"
                            value={d.isActive ? "false" : "true"}
                          />
                          <button className="btn btn-soft btn-sm" type="submit">
                            {d.isActive ? "Disable" : "Enable"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
