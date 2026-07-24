import { StatusBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { createStaffUser, updateStaffUser } from "@/app/actions";

export default async function StaffPage() {
  const [tenants, rows] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.staffUser.findMany({
      orderBy: { createdAt: "desc" },
      include: { tenant: { select: { slug: true, name: true } } },
    }),
  ]);

  return (
    <>
      <div className="page-intro">
        <p>Manage staff logins for the Admin CRM (assign tickets &amp; meetings).</p>
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <div className="panel-head">
          <h2>Add Staff</h2>
        </div>
        <form action={createStaffUser} className="filters" style={{ padding: "1rem" }}>
          <input name="firstName" required placeholder="First name" aria-label="First name" />
          <input name="lastName" required placeholder="Last name" aria-label="Last name" />
          <input name="email" type="email" required placeholder="Email" aria-label="Email" />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Password"
            aria-label="Password"
          />
          <select name="role" defaultValue="admin" aria-label="Role">
            <option value="admin">Admin</option>
            <option value="support">Support</option>
            <option value="ops">Ops</option>
          </select>
          <select name="tenantId" required defaultValue={tenants[0]?.id || ""} aria-label="Tenant">
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.slug})
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="submit">
            Create
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>{rows.length} Staff Users</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="sr-col">#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Tenant</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={s.id}>
                  <td className="sr-col">{i + 1}</td>
                  <td className="cap">
                    {s.firstName} {s.lastName}
                  </td>
                  <td>{s.email}</td>
                  <td>{s.tenant.slug}</td>
                  <td className="cap">{s.role}</td>
                  <td>
                    <StatusBadge status={s.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td>{fmtDate(s.createdAt)}</td>
                  <td>
                    <form action={updateStaffUser} className="row-actions">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="firstName" value={s.firstName} />
                      <input type="hidden" name="lastName" value={s.lastName} />
                      <input type="hidden" name="role" value={s.role} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={s.isActive ? "false" : "true"}
                      />
                      <button className="btn btn-soft btn-sm" type="submit">
                        {s.isActive ? "Disable" : "Enable"}
                      </button>
                    </form>
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
