import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { prisma } from "@/lib/prisma";
import { capitalize, fmtDate, money } from "@/lib/format";
import { deleteClient, updateClientStatus } from "@/app/actions";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
    <>
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
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
              <button className="btn btn-primary btn-sm" type="submit">
                Update Status
              </button>
            </form>
            <div style={{ marginTop: "1rem" }}>
              <ConfirmDeleteButton
                action={deleteClient}
                id={client.id}
                label="Delete Client"
                confirmText="Delete this client and all related accounts, deposits, KYC, tickets?"
              />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Trading Accounts</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="sr-col">#</th>
                  <th>Name</th>
                  <th>TP</th>
                  <th>Balance</th>
                  <th>Leverage</th>
                </tr>
              </thead>
              <tbody>
                {client.accounts.map((a, i) => (
                  <tr key={a.id}>
                    <td className="sr-col">{i + 1}</td>
                    <td className="cap">{a.name}</td>
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
                  <th className="sr-col">#</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {client.transactions.map((t, i) => (
                  <tr key={t.id}>
                    <td className="sr-col">{i + 1}</td>
                    <td>{capitalize(t.type)}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>{money(Number(t.amount), t.currency)}</td>
                  <td>{capitalize(t.paymentMethod || "—")}</td>
                  <td>{fmtDate(t.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
