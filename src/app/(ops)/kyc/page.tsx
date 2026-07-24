import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmDeleteButton } from "@/components/ConfirmDeleteButton";
import { KycPreviewButton } from "@/components/KycPreviewButton";
import { prisma } from "@/lib/prisma";
import { capitalize, fmtDate } from "@/lib/format";
import { deleteKycDocument, reviewKyc } from "@/app/actions";

export default async function KycPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status?.trim() || "PENDING";

  const rows = await prisma.kycDocument.findMany({
    where: status === "ALL" ? {} : { status },
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      client: { select: { id: true, email: true, firstName: true, lastName: true } },
      tenant: { select: { slug: true } },
    },
  });

  return (
    <>
      <form className="filters" method="get">
        <select name="status" defaultValue={status} aria-label="Status">
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ALL">All</option>
        </select>
        <button className="btn btn-primary" type="submit">
          Apply Filter
        </button>
      </form>

      <div className="panel">
        <div className="panel-head">
          <h2>{rows.length} Documents</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Client</th>
                <th>Tenant</th>
                <th>Type</th>
                <th>File</th>
                <th>Status</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>
                    <Link href={`/clients/${d.client.id}`} className="cap">
                      {d.client.firstName} {d.client.lastName}
                    </Link>
                    <div className="muted">{d.client.email}</div>
                  </td>
                  <td>{d.tenant.slug}</td>
                  <td>{capitalize(d.documentType)}</td>
                  <td>
                    {d.publicUrl || d.storagePath ? (
                      <KycPreviewButton
                        id={d.id}
                        fileName={d.fileName}
                        fallbackUrl={d.publicUrl}
                      />
                    ) : (
                      d.fileName
                    )}
                  </td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td>{fmtDate(d.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      {d.status === "PENDING" ? (
                        <>
                          <form action={reviewKyc}>
                            <input type="hidden" name="id" value={d.id} />
                            <input type="hidden" name="status" value="APPROVED" />
                            <button className="btn btn-ok btn-sm" type="submit">
                              Approve
                            </button>
                          </form>
                          <form action={reviewKyc}>
                            <input type="hidden" name="id" value={d.id} />
                            <input type="hidden" name="status" value="REJECTED" />
                            <input type="hidden" name="reviewNote" value="Rejected by admin" />
                            <button className="btn btn-warn btn-sm" type="submit">
                              Reject
                            </button>
                          </form>
                        </>
                      ) : (
                        <span className="muted">{d.reviewNote || "—"}</span>
                      )}
                      <ConfirmDeleteButton
                        action={deleteKycDocument}
                        id={d.id}
                        confirmText="Delete this KYC document?"
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
