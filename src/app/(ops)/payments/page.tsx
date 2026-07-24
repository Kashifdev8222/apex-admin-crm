import { StatusBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/prisma";
import { createPaymentMethod, updatePaymentMethod } from "@/app/actions";

export default async function PaymentsPage() {
  const [tenants, rows] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.paymentMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { tenant: { select: { slug: true } } },
    }),
  ]);

  return (
    <>
      <div className="page-intro">
        <p>Enable or disable deposit payment methods per tenant (CryptoPay, Lemuxion, etc.).</p>
      </div>

      <div className="panel" style={{ marginBottom: "1rem" }}>
        <div className="panel-head">
          <h2>Add Payment Method</h2>
        </div>
        <form action={createPaymentMethod} className="filters" style={{ padding: "1rem" }}>
          <input name="type" required placeholder="Type e.g. CryptoPay" aria-label="Type" />
          <input name="name" required placeholder="Display name" aria-label="Name" />
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
          <h2>{rows.length} Payment Methods</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Tenant</th>
                <th>Sort</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No payment methods yet.
                  </td>
                </tr>
              ) : (
                rows.map((m) => (
                  <tr key={m.id}>
                    <td colSpan={6} style={{ padding: "0.65rem 1rem" }}>
                      <form action={updatePaymentMethod} className="row-actions" style={{ flexWrap: "wrap" }}>
                        <input type="hidden" name="id" value={m.id} />
                        <input name="name" defaultValue={m.name} required style={{ minWidth: 140 }} />
                        <span className="muted">{m.type}</span>
                        <span className="muted">{m.tenant.slug}</span>
                        <input
                          name="sortOrder"
                          type="number"
                          defaultValue={m.sortOrder}
                          style={{ width: 72, minWidth: 72 }}
                        />
                        <select name="isEnabled" defaultValue={m.isEnabled ? "true" : "false"}>
                          <option value="true">Enabled</option>
                          <option value="false">Disabled</option>
                        </select>
                        <StatusBadge status={m.isEnabled ? "ACTIVE" : "INACTIVE"} />
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
