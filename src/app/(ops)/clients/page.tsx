import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { AiToggleForm } from "@/components/AiToggleForm";
import { prisma } from "@/lib/prisma";
import { fmtDate, money } from "@/lib/format";
import { toggleClientAi, updateClientStatus } from "@/app/actions";
import { clientHasAi } from "@/lib/platform-settings";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; ai?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const status = sp.status?.trim() || "";
  const ai = sp.ai?.trim() || "";

  const rows = await prisma.client.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      tenant: { select: { slug: true, name: true } },
      accounts: {
        where: { isActive: true },
        select: {
          balance: true,
          currency: true,
          externalLogin: true,
        },
        take: 1,
      },
    },
  });

  const filtered =
    ai === "on"
      ? rows.filter((c) => clientHasAi(c.tags))
      : ai === "off"
        ? rows.filter((c) => !clientHasAi(c.tags))
        : rows;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>User Management</h1>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>All users</h2>
          <form className="filter-row" method="get">
            <input
              className="input"
              name="q"
              defaultValue={q}
              placeholder="Search name or email…"
              style={{ minWidth: 200 }}
            />
            <select className="input" name="status" defaultValue={status}>
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
            <select className="input" name="ai" defaultValue={ai}>
              <option value="">AI: any</option>
              <option value="on">AI enabled</option>
              <option value="off">AI disabled</option>
            </select>
            <button className="btn btn-outline btn-sm" type="submit">
              Filter
            </button>
          </form>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="sr-col">#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>AI</th>
                <th>Account</th>
                <th>Balance</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const acc = c.accounts[0];
                const bal = acc ? money(Number(acc.balance), acc.currency) : "—";
                const on = clientHasAi(c.tags);
                const suspended = c.status.toLowerCase() === "suspended";
                return (
                  <tr key={c.id}>
                    <td className="sr-col">{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>
                      <Link href={`/clients/${c.id}`} className="cap">
                        {c.firstName} {c.lastName}
                      </Link>
                    </td>
                    <td className="muted">{c.email}</td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td>
                      <AiToggleForm
                        id={c.id}
                        enabled={on}
                        action={toggleClientAi}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {acc?.externalLogin || "—"}
                    </td>
                    <td>{bal}</td>
                    <td>{fmtDate(c.createdAt)}</td>
                    <td>
                      <div className="btn-actions">
                        <form action={updateClientStatus}>
                          <input type="hidden" name="id" value={c.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={suspended ? "active" : "suspended"}
                          />
                          {suspended ? (
                            <button
                              type="submit"
                              className="btn btn-success btn-xs"
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              type="submit"
                              className="btn btn-xs btn-suspend"
                            >
                              Suspend
                            </button>
                          )}
                        </form>
                      </div>
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
