import { StatusBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";

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
      <div className="panel">
        <div className="panel-head">
          <h2>{rows.length} ClientZones</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Active</th>
                <th>Clients</th>
                <th>Accounts</th>
                <th>Transactions</th>
                <th>Tickets</th>
                <th>Staff</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.slug}</td>
                  <td>
                    <StatusBadge status={t.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td>{t._count.clients}</td>
                  <td>{t._count.accounts}</td>
                  <td>{t._count.transactions}</td>
                  <td>{t._count.tickets}</td>
                  <td>{t._count.staffUsers}</td>
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
