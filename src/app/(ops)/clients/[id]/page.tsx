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

  const initials =
    `${client.firstName?.[0] || ""}${client.lastName?.[0] || ""}`.toUpperCase() ||
    client.email.slice(0, 2).toUpperCase();
  const totalBal = client.accounts.reduce((s, a) => s + Number(a.balance), 0);
  const currency = client.accounts[0]?.currency || "USD";

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="cap">
            {client.firstName} {client.lastName}
          </h1>
          <div className="breadcrumb">
            <Link href="/clients">User Management</Link>
            {" / "}
            {client.tenant.name} ({client.tenant.slug})
          </div>
        </div>
        <StatusBadge status={client.status} />
      </div>

      <div
        className="dash-panel"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        <div className="user-avatar" style={{ width: 56, height: 56, fontSize: 18 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div
            className="cap"
            style={{
              fontFamily: "var(--fh)",
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            {client.firstName} {client.lastName}
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8" }}>{client.email}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
            {client.phone || "No phone"} · {client.country || "—"} · Joined{" "}
            {fmtDate(client.createdAt)}
          </div>
        </div>
        <form action={updateClientStatus} className="row-actions">
          <input type="hidden" name="id" value={client.id} />
          <select name="status" defaultValue={client.status} className="form-select">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
          <button className="btn btn-primary btn-sm" type="submit">
            Update status
          </button>
          <ConfirmDeleteButton
            action={deleteClient}
            id={client.id}
            label="Delete"
            confirmText="Delete this client and all related accounts, deposits, KYC, tickets?"
          />
        </form>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="value">{money(totalBal, currency)}</div>
          <div className="label">Total balance</div>
        </div>
        <div className="stat">
          <div className="value">{client.accounts.length}</div>
          <div className="label">Trading accounts</div>
        </div>
        <div className="stat">
          <div className="value">{client.documents.length}</div>
          <div className="label">KYC documents</div>
        </div>
        <div className="stat">
          <div className="value">{client.tickets.length}</div>
          <div className="label">Recent tickets</div>
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
                <th>Equity</th>
                <th>Leverage</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {client.accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No accounts.
                  </td>
                </tr>
              ) : (
                client.accounts.map((a, i) => (
                  <tr key={a.id}>
                    <td className="sr-col">{i + 1}</td>
                    <td className="cap">{a.name}</td>
                    <td>{a.externalLogin || "—"}</td>
                    <td>{money(Number(a.balance), a.currency)}</td>
                    <td>{money(Number(a.equity), a.currency)}</td>
                    <td>1:{a.leverage}</td>
                    <td>
                      <span className={`badge ${a.isDemoAccount ? "badge-amber" : "badge-blue"}`}>
                        {a.isDemoAccount ? "Demo" : "Real"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h2>Recent transactions</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="sr-col">#</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {client.transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No transactions.
                    </td>
                  </tr>
                ) : (
                  client.transactions.map((t, i) => (
                    <tr key={t.id}>
                      <td className="sr-col">{i + 1}</td>
                      <td>{capitalize(t.type)}</td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td>{money(Number(t.amount), t.currency)}</td>
                      <td>{fmtDate(t.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>KYC & tickets</h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Detail</th>
                  <th>Status</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {client.documents.map((d) => (
                  <tr key={d.id}>
                    <td>KYC</td>
                    <td>{d.documentType || "Document"}</td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td>{fmtDate(d.createdAt)}</td>
                  </tr>
                ))}
                {client.tickets.map((t) => (
                  <tr key={t.id}>
                    <td>Ticket</td>
                    <td>
                      <Link href={`/tickets/${t.id}`}>{t.title}</Link>
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>{fmtDate(t.createdAt)}</td>
                  </tr>
                ))}
                {client.documents.length === 0 && client.tickets.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      No KYC or tickets.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
