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
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const status = sp.status?.trim() || "PENDING";
  const type = sp.type?.trim() || "";

  const rows = await prisma.kycDocument.findMany({
    where: {
      ...(status === "ALL" ? {} : { status }),
      ...(type ? { documentType: { contains: type, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      client: { select: { id: true, email: true, firstName: true, lastName: true } },
      tenant: { select: { slug: true } },
    },
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>KYC &amp; Documents</h1>
          <div className="breadcrumb">Review uploaded identity and proof documents</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Document review queue</h2>
          <form className="filter-row" method="get" style={{ margin: 0 }}>
            <select name="status" defaultValue={status} aria-label="Status">
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="ALL">All status</option>
            </select>
            <select name="type" defaultValue={type} aria-label="Type">
              <option value="">All types</option>
              <option value="passport">Passport</option>
              <option value="id">ID Card</option>
              <option value="address">Proof of address</option>
            </select>
            <button className="btn btn-primary btn-sm" type="submit">
              Apply
            </button>
          </form>
        </div>
        <div className="panel-body nopad">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th className="sr-col">#</th>
                  <th>User</th>
                  <th>Document type</th>
                  <th>File</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th className="actions-col" />
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="muted">
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  rows.map((d, i) => (
                    <tr key={d.id}>
                      <td className="sr-col">{i + 1}</td>
                      <td>
                        <Link
                          href={`/clients/${d.client.id}`}
                          className="cap"
                          style={{ fontWeight: 500 }}
                        >
                          {d.client.firstName} {d.client.lastName}
                        </Link>
                        <div className="muted">{d.client.email}</div>
                      </td>
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
                      <td>{fmtDate(d.createdAt)}</td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="actions-col">
                        <div className="btn-actions">
                          {d.status === "PENDING" ? (
                            <>
                              <form className="inline-action" action={reviewKyc}>
                                <input type="hidden" name="id" value={d.id} />
                                <input type="hidden" name="status" value="APPROVED" />
                                <button className="btn btn-success btn-xs" type="submit">
                                  Approve
                                </button>
                              </form>
                              <form className="inline-action" action={reviewKyc}>
                                <input type="hidden" name="id" value={d.id} />
                                <input type="hidden" name="status" value="REJECTED" />
                                <input
                                  type="hidden"
                                  name="reviewNote"
                                  value="Rejected by admin"
                                />
                                <button className="btn btn-danger btn-xs" type="submit">
                                  Reject
                                </button>
                              </form>
                            </>
                          ) : (
                            <span className="btn btn-ghost btn-xs">View</span>
                          )}
                          <ConfirmDeleteButton
                            action={deleteKycDocument}
                            id={d.id}
                            confirmText="Delete this KYC document?"
                            className="btn btn-danger btn-xs"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
