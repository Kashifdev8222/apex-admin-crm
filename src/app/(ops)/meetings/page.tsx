import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { deleteMeeting, updateMeetingMeta } from "@/app/actions";

export default async function MeetingsPage() {
  const [rows, staff] = await Promise.all([
    prisma.meeting.findMany({
      orderBy: { date: "desc" },
      take: 150,
      include: {
        client: { select: { id: true, email: true, firstName: true, lastName: true } },
        tenant: { select: { slug: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.staffUser.findMany({
      where: { isActive: true },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true, tenantId: true },
    }),
  ]);

  return (
    <>
      <div className="panel">
        <div className="panel-head">
          <h2>{rows.length} Meetings</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="sr-col">#</th>
                <th>Title</th>
                <th>Client</th>
                <th>When</th>
                <th>Assignee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m, i) => (
                <tr key={m.id}>
                  <td className="sr-col">{i + 1}</td>
                  <td>
                    {m.title}
                    <div className="muted">{m.tenant.slug}</div>
                  </td>
                  <td>
                    <Link href={`/clients/${m.client.id}`} className="cap">
                      {m.client.firstName} {m.client.lastName}
                    </Link>
                  </td>
                  <td>
                    {fmtDate(m.date)}
                    <div className="muted">{m.meetingPeriod} Min</div>
                  </td>
                  <td className="cap">
                    {m.assignee
                      ? `${m.assignee.firstName} ${m.assignee.lastName}`
                      : "—"}
                  </td>
                  <td>
                    <StatusBadge status={m.status} />
                  </td>
                  <td>
                    <div className="row-actions">
                      <form action={updateMeetingMeta} className="row-actions">
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="title" value={m.title} />
                        <select name="status" defaultValue={m.status}>
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="canceled">Canceled</option>
                          <option value="no_show">No Show</option>
                        </select>
                        <select
                          name="assignedStaffId"
                          defaultValue={m.assignedStaffId || ""}
                          aria-label="Assignee"
                        >
                          <option value="">Unassigned</option>
                          {staff
                            .filter((s) => s.tenantId === m.tenantId)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.firstName} {s.lastName}
                              </option>
                            ))}
                        </select>
                        <button className="btn btn-primary btn-sm" type="submit">
                          Save
                        </button>
                      </form>
                      <ConfirmDeleteButton
                        action={deleteMeeting}
                        id={m.id}
                        confirmText="Delete this meeting?"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
