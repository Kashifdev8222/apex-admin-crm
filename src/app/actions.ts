"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  SESSION_COOKIE,
  authenticateStaff,
  createSessionToken,
  requireSession,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const user = await authenticateStaff(email, password);
  if (!user) {
    return { ok: false as const, error: "Wrong email or password" };
  }
  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect("/dashboard");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function updateDepositStatus(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as
    | "COMPLETED"
    | "FAILED"
    | "CANCELED"
    | "PROCESSING";
  const note = String(formData.get("note") || "") || undefined;

  const tx = await prisma.transaction.findFirst({
    where: { id, type: "DEPOSIT" },
  });
  if (!tx) return;

  if (tx.status === "COMPLETED" && status === "COMPLETED") return;

  await prisma.$transaction(async (db) => {
    await db.transaction.update({
      where: { id: tx.id },
      data: { status, note: note || tx.note },
    });
    if (status === "COMPLETED" && tx.status !== "COMPLETED") {
      await db.tradingAccount.update({
        where: { id: tx.accountId },
        data: {
          balance: { increment: tx.amount },
          equity: { increment: tx.amount },
          freeMargin: { increment: tx.amount },
        },
      });
    }
  });

  revalidatePath("/deposits");
  revalidatePath("/dashboard");
}

export async function updateWithdrawStatus(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as
    | "COMPLETED"
    | "FAILED"
    | "CANCELED"
    | "PROCESSING";
  const note = String(formData.get("note") || "") || undefined;

  const tx = await prisma.transaction.findFirst({
    where: { id, type: "WITHDRAW" },
  });
  if (!tx) return;

  if (tx.status === "COMPLETED" || tx.status === "CANCELED") return;

  await prisma.$transaction(async (db) => {
    await db.transaction.update({
      where: { id: tx.id },
      data: { status, note: note || tx.note },
    });
    if (
      (status === "FAILED" || status === "CANCELED") &&
      (tx.status === "PENDING" || tx.status === "PROCESSING")
    ) {
      await db.tradingAccount.update({
        where: { id: tx.accountId },
        data: {
          balance: { increment: tx.amount },
          equity: { increment: tx.amount },
          freeMargin: { increment: tx.amount },
        },
      });
    }
  });

  revalidatePath("/withdrawals");
  revalidatePath("/dashboard");
}

export async function reviewKyc(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const reviewNote = String(formData.get("reviewNote") || "") || null;

  const row = await prisma.kycDocument.findFirst({ where: { id } });
  if (!row) return;

  await prisma.kycDocument.update({
    where: { id },
    data: {
      status,
      reviewNote,
      reviewedBy: session.staffId,
      reviewedAt: new Date(),
    },
  });

  revalidatePath("/kyc");
}

export async function updateTicketStatus(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  await prisma.ticket.update({ where: { id }, data: { status } });
  revalidatePath("/tickets");
  revalidatePath(`/tickets/${id}`);
}

export async function addTicketComment(formData: FormData) {
  const session = await requireSession();
  const ticketId = String(formData.get("ticketId") || "");
  const text = String(formData.get("text") || "").trim();
  if (!text) return;

  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId } });
  if (!ticket) return;

  await prisma.ticketComment.create({
    data: {
      tenantId: ticket.tenantId,
      ticketId,
      authorType: "staff",
      authorId: session.staffId,
      text,
    },
  });

  revalidatePath(`/tickets/${ticketId}`);
}

export async function updateClientStatus(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  await prisma.client.update({ where: { id }, data: { status } });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function updateMeetingStatus(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  await prisma.meeting.update({ where: { id }, data: { status } });
  revalidatePath("/meetings");
}
