import { NextResponse } from "next/server";
import { readSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const BUCKET = "kyc-documents";

function guessMime(fileName: string) {
  const n = fileName.toLowerCase();
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".gif")) return "image/gif";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

/**
 * Same-origin KYC file proxy.
 * Private Supabase signed URLs often break inside <img> (referrer / CORP),
 * while "open in new tab" still works — proxy fixes in-modal preview.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const doc = await prisma.kycDocument.findFirst({
    where: { id },
    select: { id: true, storagePath: true, publicUrl: true, fileName: true },
  });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mime = guessMime(doc.fileName);

  if (supabaseUrl && serviceKey && doc.storagePath) {
    // Authenticated download (service role) — path segments encoded once
    const objectUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${doc.storagePath
      .split("/")
      .map((p) => encodeURIComponent(p))
      .join("/")}`;

    const upstream = await fetch(objectUrl, {
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
      cache: "no-store",
    });

    if (upstream.ok && upstream.body) {
      return new NextResponse(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": upstream.headers.get("content-type") || mime,
          "Cache-Control": "private, max-age=120",
          "Content-Disposition": `inline; filename="${doc.fileName.replace(/"/g, "")}"`,
        },
      });
    }

    // Fallback: fresh signed URL then fetch bytes
    const signRes = await fetch(
      `${supabaseUrl}/storage/v1/object/sign/${BUCKET}/${doc.storagePath
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expiresIn: 3600 }),
      },
    );
    if (signRes.ok) {
      const signed = (await signRes.json()) as { signedURL?: string; signedUrl?: string };
      const path = signed.signedURL || signed.signedUrl;
      if (path) {
        const full = path.startsWith("http") ? path : `${supabaseUrl}/storage/v1${path}`;
        const fileRes = await fetch(full, { cache: "no-store" });
        if (fileRes.ok && fileRes.body) {
          return new NextResponse(fileRes.body, {
            status: 200,
            headers: {
              "Content-Type": fileRes.headers.get("content-type") || mime,
              "Cache-Control": "private, max-age=120",
              "Content-Disposition": `inline; filename="${doc.fileName.replace(/"/g, "")}"`,
            },
          });
        }
      }
    }
  }

  // Last resort: redirect to stored public/signed URL
  if (doc.publicUrl) {
    return NextResponse.redirect(doc.publicUrl, 302);
  }

  return NextResponse.json(
    { error: "File storage not configured or file missing" },
    { status: 502 },
  );
}
