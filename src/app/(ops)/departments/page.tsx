import { StatusBadge } from "@/components/StatusBadge";
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
                  <td colSpan={6} className="muted">
                    No departments yet. Create one above.
                  </td>
                </tr>
              ) : (
                rows.map((d) => (
                  <tr key={d.id}>
                    <td colSpan={6} style={{ padding: "0.65rem 1rem" }}>
                      <form
                        action={updateDepartment}
                        className="row-actions"
                        style={{ alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}
                      >
                        <input type="hidden" name="id" value={d.id} />
                        <input
                          name="name"
                          defaultValue={d.name}
                          required
                          style={{ minWidth: 160 }}
                          aria-label="Name"
                        />
                        <span className="muted">{d.tenant.slug}</span>
                        <span className="muted">{d._count.tickets} tickets</span>
                        <input
                          name="sortOrder"
                          type="number"
                          defaultValue={d.sortOrder}
                          style={{ width: 72, minWidth: 72 }}
                          aria-label="Sort"
                        />
                        <select
                          name="isActive"
                          defaultValue={d.isActive ? "true" : "false"}
                          aria-label="Active"
                        >
                          <option value="true">Active</option>
                          <option value="false">Inactive</option>
                        </select>
                        <StatusBadge status={d.isActive ? "ACTIVE" : "INACTIVE"} />
                        <button className="btn btn-soft btn-sm" type="submit">
                          Save
                        </button>
                      </form>
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
