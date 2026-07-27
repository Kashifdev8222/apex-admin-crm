import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const action = sp.action?.trim() || "";
  const q = sp.q?.trim() || "";

  const rows = await prisma.auditLog.findMany({
    where: {
      ...(action ? { action: { contains: action, mode: "insensitive" } } : {}),
      ...(q
        ? {
            OR: [
              { action: { contains: q, mode: "insensitive" } },
              { actorType: { contains: q, mode: "insensitive" } },
              { entityType: { contains: q, mode: "insensitive" } },
              { entityId: { contains: q, mode: "insensitive" } },
              { actorId: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Activity Log</h1>
          <div className="breadcrumb">Audit trail of platform actions</div>
        </div>
      </div>

      <form className="filters" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search actor, entity, action…"
          aria-label="Search"
        />
        <input
          name="action"
          defaultValue={action}
          placeholder="Filter by action"
          aria-label="Action"
        />
        <button className="btn btn-primary" type="submit">
          Apply filter
        </button>
      </form>

      <div className="panel">
        <div className="panel-head">
          <h2>{rows.length} Events</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="sr-col">#</th>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Meta</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No audit events yet. Actions will appear here as the
                    platform records them.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr key={r.id}>
                    <td className="sr-col">{i + 1}</td>
                    <td>{fmtDate(r.createdAt)}</td>
                    <td>
                      <span className="cap">{r.actorType}</span>
                      {r.actorId ? (
                        <div className="muted mono-cell">{r.actorId.slice(0, 8)}…</div>
                      ) : null}
                    </td>
                    <td>
                      <span className="badge badge-blue">{r.action}</span>
                    </td>
                    <td>
                      {r.entityType || "—"}
                      {r.entityId ? (
                        <div className="muted">{r.entityId.slice(0, 8)}…</div>
                      ) : null}
                    </td>
                    <td>
                      <span className="muted" style={{ fontSize: 11 }}>
                        {r.meta ? JSON.stringify(r.meta).slice(0, 80) : "—"}
                      </span>
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
