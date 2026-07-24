import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { prisma } from "@/lib/prisma";
import { capitalize, fmtDate } from "@/lib/format";
import {
  addTicketComment,
  deleteTicket,
  updateTicketMeta,
} from "@/app/actions";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ticket = await prisma.ticket.findFirst({
    where: { id },
    include: {
      client: true,
      tenant: true,
      department: true,
      assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();

  const [departments, staff] = await Promise.all([
    prisma.ticketDepartment.findMany({
      where: { tenantId: ticket.tenantId, isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.staffUser.findMany({
      where: { tenantId: ticket.tenantId, isActive: true },
      orderBy: { firstName: "asc" },
      select: { id: true, firstName: true, lastName: true, email: true },
    }),
  ]);

  return (
    <>
      <p className="muted" style={{ marginTop: 0 }}>
        <Link href="/tickets">← Tickets</Link> · {ticket.tenant.slug} ·{" "}
        {ticket.client.email}
      </p>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h2>{ticket.title}</h2>
            <StatusBadge status={ticket.status} />
          </div>
          <div className="stack" style={{ padding: "1rem" }}>
            {ticket.comments.length === 0 ? (
              <p className="muted">No comments yet.</p>
            ) : (
              ticket.comments.map((c) => (
                <div key={c.id} className="comment">
                  <div className="muted" style={{ fontSize: "0.78rem", marginBottom: "0.35rem" }}>
                    <span className="cap">{c.authorType}</span> · {fmtDate(c.createdAt)}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{c.text}</div>
                </div>
              ))
            )}
            <form action={addTicketComment} className="stack">
              <input type="hidden" name="ticketId" value={ticket.id} />
              <textarea name="text" rows={4} placeholder="Reply as staff…" required />
              <button className="btn btn-primary" type="submit">
                Send reply
              </button>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>Details</h2>
          </div>
          <div style={{ padding: "1rem" }}>
            <p>
              <strong>Category:</strong> {capitalize(ticket.category)}
            </p>
            <p>
              <strong>Created:</strong> {fmtDate(ticket.createdAt)}
            </p>
            <form action={updateTicketMeta} className="stack" style={{ marginTop: "1rem" }}>
              <input type="hidden" name="id" value={ticket.id} />
              <div className="field">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={ticket.status}>
                  <option value="New">New</option>
                  <option value="Open">Open</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="departmentId">Department</label>
                <select
                  id="departmentId"
                  name="departmentId"
                  defaultValue={ticket.departmentId || ""}
                >
                  <option value="">Unassigned</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="assignedStaffId">Assignee</label>
                <select
                  id="assignedStaffId"
                  name="assignedStaffId"
                  defaultValue={ticket.assignedStaffId || ""}
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.email})
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary" type="submit">
                Save changes
              </button>
            </form>
            <div style={{ marginTop: "1rem" }}>
              <ConfirmDeleteButton
                action={deleteTicket}
                id={ticket.id}
                label="Delete ticket"
                confirmText="Delete this ticket and all comments?"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
