import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmtDate, money } from "@/lib/format";
import { updateClientStatus } from "@/app/actions";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id },
    include: {
      tenant: true,
      accounts: { orderBy: { createdAt: "desc" } },
      transactions: { orderBy: { createdAt: "desc" }, take: 40 },
      documents: { orderBy: { createdAt: "desc" }, take: 20 },
      tickets: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!client) notFound();

  return (
    <AppShell user={user} title={`${client.firstName} ${client.lastName}`}>
      <p className="muted" style={{ marginTop: 0 }}>
        <Link href="/clients">← Clients</Link> · {client.tenant.name} ({client.tenant.slug})
      </p>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Profile</h2>
            <StatusBadge status={client.status} />
          </div>
          <div style={{ padding: "1rem 1.1rem" }}>
            <p>
              <strong>Email:</strong> {client.email}
            </p>
            <p>
              <strong>Phone:</strong> {client.phone || "—"}
            </p>
            <p>
              <strong>Country:</strong> {client.country || "—"}
            </p>
            <p>
              <strong>Joined:</strong> {fmtDate(client.createdAt)}
            </p>
            <form action={updateClientStatus} className="row-actions" style={{ marginTop: "1rem" }}>
              <input type="hidden" name="id" value={client.id} />
              <select name="status" defaultValue={client.status}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="blocked">blocked</option>
              </select>
              <button className="btn btn-primary btn-sm" type="submit">
                Update status
              </button>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Trading accounts</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>TP</th>
                  <th>Balance</th>
                  <th>Leverage</th>
                </tr>
              </thead>
              <tbody>
                {client.accounts.map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td>{a.externalLogin || "—"}</td>
                    <td>{money(Number(a.balance), a.currency)}</td>
                    <td>1:{a.leverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: "1rem" }}>
        <div className="panel-head">
          <h2>Transactions</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {client.transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.type}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>{money(Number(t.amount), t.currency)}</td>
                  <td>{t.paymentMethod || "—"}</td>
                  <td>{fmtDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
