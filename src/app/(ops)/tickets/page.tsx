import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { prisma } from "@/lib/prisma";
import { capitalize, fmtDate } from "@/lib/format";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status?.trim() || "";

  const rows = await prisma.ticket.findMany({
    where: status ? { status } : {},
    orderBy: { updatedAt: "desc" },
    take: 150,
    include: {
      client: { select: { id: true, email: true, firstName: true, lastName: true } },
      tenant: { select: { slug: true } },
      department: { select: { name: true } },
      _count: { select: { comments: true } },
    },
  });

  return (
    <>
      <form className="filters" method="get">
        <select name="status" defaultValue={status} aria-label="Status">
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Open">Open</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
        <button className="btn btn-primary" type="submit">
          Apply Filter
        </button>
      </form>

      <div className="panel">
        <div className="panel-head">
          <h2>{rows.length} Tickets</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Title</th>
                <th>Client</th>
                <th>Tenant</th>
                <th>Category</th>
                <th>Status</th>
                <th>Comments</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id}>
                  <td>
                    <Link href={`/tickets/${t.id}`}>{t.title}</Link>
                    <div className="muted">{t.department?.name || "—"}</div>
                  </td>
                  <td>
                    <span className="cap">
                      {t.client.firstName} {t.client.lastName}
                    </span>
                    <div className="muted">{t.client.email}</div>
                  </td>
                  <td>{t.tenant.slug}</td>
                  <td>{capitalize(t.category)}</td>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td>{t._count.comments}</td>
                  <td>{fmtDate(t.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
