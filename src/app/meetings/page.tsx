import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { updateMeetingStatus } from "@/app/actions";

export default async function MeetingsPage() {
  const user = await requireUser();

  const rows = await prisma.meeting.findMany({
    orderBy: { date: "desc" },
    take: 150,
    include: {
      client: { select: { id: true, email: true, firstName: true, lastName: true } },
      tenant: { select: { slug: true } },
      assignee: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  return (
    <AppShell user={user} title="Meetings">
      <div className="panel">
        <div className="panel-head">
          <h2>{rows.length} meetings</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Title</th>
                <th>Client</th>
                <th>Tenant</th>
                <th>When</th>
                <th>Importance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id}>
                  <td>
                    {m.title}
                    <div className="muted">{m.description || "—"}</div>
                  </td>
                  <td>
                    <Link href={`/clients/${m.client.id}`}>
                      {m.client.firstName} {m.client.lastName}
                    </Link>
                  </td>
                  <td>{m.tenant.slug}</td>
                  <td>
                    {fmtDate(m.date)}
                    <div className="muted">{m.meetingPeriod} min</div>
                  </td>
                  <td>{m.importance}</td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td>
                    <form action={updateMeetingStatus} className="row-actions">
                      <input type="hidden" name="id" value={m.id} />
                      <select name="status" defaultValue={m.status}>
                        <option value="scheduled">scheduled</option>
                        <option value="completed">completed</option>
                        <option value="canceled">canceled</option>
                        <option value="no_show">no_show</option>
                      </select>
                      <button className="btn btn-primary btn-sm" type="submit">
                        Save
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
