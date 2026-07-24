import { StatusBadge } from "@/components/StatusBadge";
import { EditRowModal } from "@/components/EditRowModal";
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
                    <td>{m.name}</td>
                    <td>{m.type}</td>
                    <td>{m.tenant.slug}</td>
                    <td>{m.sortOrder}</td>
                    <td>
                      <StatusBadge status={m.isEnabled ? "ACTIVE" : "INACTIVE"} />
                    </td>
                    <td>
                      <div className="row-actions">
                        <EditRowModal
                          title={`Edit · ${m.name}`}
                          action={updatePaymentMethod}
                          hidden={{ id: m.id }}
                          fields={[
                            {
                              name: "name",
                              label: "Display name",
                              defaultValue: m.name,
                              required: true,
                            },
                            {
                              name: "sortOrder",
                              label: "Sort order",
                              type: "number",
                              defaultValue: m.sortOrder,
                            },
                            {
                              name: "isEnabled",
                              label: "Status",
                              type: "select",
                              defaultValue: m.isEnabled ? "true" : "false",
                              options: [
                                { value: "true", label: "Enabled" },
                                { value: "false", label: "Disabled" },
                              ],
                            },
                          ]}
                        />
                        <form action={updatePaymentMethod}>
                          <input type="hidden" name="id" value={m.id} />
                          <input type="hidden" name="name" value={m.name} />
                          <input type="hidden" name="sortOrder" value={String(m.sortOrder)} />
                          <input
                            type="hidden"
                            name="isEnabled"
                            value={m.isEnabled ? "false" : "true"}
                          />
                          <button className="btn btn-soft btn-sm" type="submit">
                            {m.isEnabled ? "Disable" : "Enable"}
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
