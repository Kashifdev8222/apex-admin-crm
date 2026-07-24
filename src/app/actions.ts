"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
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
  // Client navigates with overlay — avoids white flash from server redirect
  return { ok: true as const };
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

export async function updateDepositStatus(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const raw = String(formData.get("status") || "");
  const note = String(formData.get("note") || "") || undefined;

  const statusMap: Record<string, "COMPLETED" | "FAILED" | "CANCELED" | "PROCESSING" | "PENDING"> = {
    COMPLETED: "COMPLETED",
    APPROVED: "COMPLETED",
    FAILED: "FAILED",
    REJECTED: "FAILED",
    CANCELED: "CANCELED",
    CANCELLED: "CANCELED",
    PROCESSING: "PROCESSING",
    PENDING: "PENDING",
  };
  const status = statusMap[raw.toUpperCase()];
  if (!status) return;

  const tx = await prisma.transaction.findFirst({
    where: { id, type: "DEPOSIT" },
  });
  if (!tx) return;

  if (tx.status === "COMPLETED" && status === "COMPLETED") return;

  await prisma.$transaction(async (db) => {
    await db.transaction.update({
      where: { id: tx.id },
      data: {
        status,
        ...(status === "FAILED"
          ? { note: note || "Rejected by admin" }
          : status === "CANCELED"
            ? { note: note || "Canceled by admin" }
            : status === "COMPLETED" || status === "PENDING" || status === "PROCESSING"
              ? { note: null }
              : note
                ? { note }
                : {}),
      },
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
  revalidateTag("dashboard");
}

export async function updateWithdrawStatus(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const raw = String(formData.get("status") || "");
  const note = String(formData.get("note") || "") || undefined;

  const statusMap: Record<string, "COMPLETED" | "FAILED" | "CANCELED" | "PROCESSING" | "PENDING"> = {
    COMPLETED: "COMPLETED",
    APPROVED: "COMPLETED",
    FAILED: "FAILED",
    REJECTED: "FAILED",
    CANCELED: "CANCELED",
    CANCELLED: "CANCELED",
    PROCESSING: "PROCESSING",
    PENDING: "PENDING",
  };
  const status = statusMap[raw.toUpperCase()];
  if (!status) return;

  const tx = await prisma.transaction.findFirst({
    where: { id, type: "WITHDRAW" },
  });
  if (!tx) return;

  if (tx.status === "COMPLETED" || tx.status === "CANCELED") return;

  await prisma.$transaction(async (db) => {
    await db.transaction.update({
      where: { id: tx.id },
      data: {
        status,
        ...(status === "FAILED"
          ? { note: note || "Rejected by admin" }
          : status === "CANCELED"
            ? { note: note || "Canceled by admin" }
            : status === "COMPLETED" || status === "PENDING" || status === "PROCESSING"
              ? { note: null }
              : note
                ? { note }
                : {}),
      },
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
  revalidateTag("dashboard");
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
  revalidateTag("dashboard");
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

export async function deleteTransaction(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const tx = await prisma.transaction.findFirst({ where: { id } });
  if (!tx) return;
  await prisma.transaction.delete({ where: { id } });
  revalidatePath("/deposits");
  revalidatePath("/withdrawals");
  revalidatePath("/dashboard");
  revalidateTag("dashboard");
  revalidatePath(`/clients/${tx.clientId}`);
}

export async function deleteTicket(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  await prisma.ticketComment.deleteMany({ where: { ticketId: id } });
  await prisma.ticket.delete({ where: { id } });
  revalidatePath("/tickets");
  redirect("/tickets");
}

export async function deleteMeeting(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  await prisma.meeting.delete({ where: { id } });
  revalidatePath("/meetings");
}

export async function deleteKycDocument(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  await prisma.kycDocument.delete({ where: { id } });
  revalidatePath("/kyc");
}

export async function deleteAccount(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const openTx = await prisma.transaction.count({ where: { accountId: id } });
  if (openTx > 0) {
    await prisma.transaction.deleteMany({ where: { accountId: id } });
  }
  await prisma.tradingAccount.delete({ where: { id } });
  revalidatePath("/accounts");
  revalidatePath("/clients");
}

export async function deleteClient(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const client = await prisma.client.findFirst({ where: { id } });
  if (!client) return;

  await prisma.$transaction(async (db) => {
    const tickets = await db.ticket.findMany({
      where: { clientId: id },
      select: { id: true },
    });
    const ticketIds = tickets.map((t) => t.id);
    if (ticketIds.length) {
      await db.ticketComment.deleteMany({ where: { ticketId: { in: ticketIds } } });
      await db.ticket.deleteMany({ where: { clientId: id } });
    }
    await db.meeting.deleteMany({ where: { clientId: id } });
    await db.kycDocument.deleteMany({ where: { clientId: id } });
    await db.transaction.deleteMany({ where: { clientId: id } });
    await db.transactionSource.deleteMany({ where: { clientId: id } });
    await db.tradingAccount.deleteMany({ where: { clientId: id } });
    await db.client.delete({ where: { id } });
  });

  revalidatePath("/clients");
  revalidatePath("/dashboard");
  redirect("/clients");
}

/* ——— Departments ——— */
export async function createDepartment(formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") || "").trim();
  const tenantId = String(formData.get("tenantId") || session.homeTenantId);
  if (!name) return;
  const sortOrder = Number(formData.get("sortOrder") || 0) || 0;
  await prisma.ticketDepartment.create({
    data: { tenantId, name, sortOrder, isActive: true },
  });
  revalidatePath("/departments");
}

export async function updateDepartment(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const isActive = String(formData.get("isActive") || "") === "true";
  const sortOrder = Number(formData.get("sortOrder") || 0) || 0;
  if (!id || !name) return;
  await prisma.ticketDepartment.update({
    where: { id },
    data: { name, isActive, sortOrder },
  });
  revalidatePath("/departments");
  revalidatePath("/tickets");
}

/* ——— Staff ——— */
export async function createStaffUser(formData: FormData) {
  const session = await requireSession();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const role = String(formData.get("role") || "admin").trim() || "admin";
  const tenantId = String(formData.get("tenantId") || session.homeTenantId);
  if (!email || !password || !firstName || !lastName) return;

  const bcrypt = (await import("bcryptjs")).default;
  const passwordHash = await bcrypt.hash(password, 8);
  await prisma.staffUser.create({
    data: { tenantId, email, passwordHash, firstName, lastName, role, isActive: true },
  });
  revalidatePath("/staff");
}

export async function updateStaffUser(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();
  const role = String(formData.get("role") || "admin").trim() || "admin";
  const isActive = String(formData.get("isActive") || "") === "true";
  const password = String(formData.get("password") || "");
  if (!id || !firstName || !lastName) return;

  const data: {
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    passwordHash?: string;
  } = { firstName, lastName, role, isActive };

  if (password.length >= 6) {
    const bcrypt = (await import("bcryptjs")).default;
    data.passwordHash = await bcrypt.hash(password, 8);
  }

  await prisma.staffUser.update({ where: { id }, data });
  revalidatePath("/staff");
}

/* ——— Payment methods ——— */
export async function updatePaymentMethod(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const isEnabled = String(formData.get("isEnabled") || "") === "true";
  const sortOrder = Number(formData.get("sortOrder") || 0) || 0;
  if (!id || !name) return;
  await prisma.paymentMethod.update({
    where: { id },
    data: { name, isEnabled, sortOrder },
  });
  revalidatePath("/payments");
}

export async function createPaymentMethod(formData: FormData) {
  const session = await requireSession();
  const type = String(formData.get("type") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const tenantId = String(formData.get("tenantId") || session.homeTenantId);
  if (!type || !name) return;
  await prisma.paymentMethod.create({
    data: {
      tenantId,
      type,
      name,
      isEnabled: true,
      sortOrder: Number(formData.get("sortOrder") || 0) || 0,
      config: {},
    },
  });
  revalidatePath("/payments");
}

/* ——— Ticket assignment ——— */
export async function updateTicketMeta(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "").trim();
  const departmentId = String(formData.get("departmentId") || "").trim();
  const assignedStaffId = String(formData.get("assignedStaffId") || "").trim();
  if (!id) return;
  await prisma.ticket.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      departmentId: departmentId || null,
      assignedStaffId: assignedStaffId || null,
    },
  });
  revalidatePath(`/tickets/${id}`);
  revalidatePath("/tickets");
}

/* ——— Meeting assignment ——— */
export async function updateMeetingMeta(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const assignedStaffId = String(formData.get("assignedStaffId") || "").trim();
  const dateRaw = String(formData.get("date") || "").trim();
  if (!id) return;
  await prisma.meeting.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(title ? { title } : {}),
      assignedStaffId: assignedStaffId || null,
      ...(dateRaw ? { date: new Date(dateRaw) } : {}),
    },
  });
  revalidatePath("/meetings");
}

/* ——— Tenant settings ——— */
export async function updateTenant(formData: FormData) {
  await requireSession();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const defaultMtGroup = String(formData.get("defaultMtGroup") || "").trim();
  const defaultLeverage = Number(formData.get("defaultLeverage") || 100) || 100;
  const isActive = String(formData.get("isActive") || "") === "true";
  if (!id || !name) return;
  await prisma.tenant.update({
    where: { id },
    data: {
      name,
      isActive,
      defaultLeverage,
      ...(defaultMtGroup ? { defaultMtGroup } : {}),
    },
  });
  revalidatePath("/tenants");
}


