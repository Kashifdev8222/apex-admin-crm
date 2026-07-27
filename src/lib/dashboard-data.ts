import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type DashboardStats = {
  tenants: number;
  clients: number;
  accounts: number;
  openTickets: number;
  pendingDeposits: number;
  pendingWithdraws: number;
  pendingKyc: number;
  aum: number;
  pendingDepositAmount: number;
  pendingWithdrawAmount: number;
};

export type DashboardTx = {
  id: string;
  type: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  client: { email: string; firstName: string; lastName: string };
  tenant: { slug: string };
};

export type PendingApprovalTx = {
  id: string;
  type: string;
  amount: number;
  currency: string;
  createdAt: string;
  client: { id: string; firstName: string; lastName: string };
};

export type PendingApprovalKyc = {
  id: string;
  documentType: string;
  createdAt: string;
  client: { id: string; firstName: string; lastName: string };
};

function statNum(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  // Prisma Decimal
  if (value && typeof value === "object" && "toNumber" in value) {
    try {
      const n = (value as { toNumber: () => number }).toNumber();
      return Number.isFinite(n) ? n : 0;
    } catch {
      return 0;
    }
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeStats(row: Record<string, unknown> | undefined): DashboardStats {
  const r = row ?? {};
  return {
    tenants: statNum(r.tenants),
    clients: statNum(r.clients),
    accounts: statNum(r.accounts),
    openTickets: statNum(r.openTickets),
    pendingDeposits: statNum(r.pendingDeposits),
    pendingWithdraws: statNum(r.pendingWithdraws),
    pendingKyc: statNum(r.pendingKyc),
    aum: statNum(r.aum),
    pendingDepositAmount: statNum(r.pendingDepositAmount),
    pendingWithdrawAmount: statNum(r.pendingWithdrawAmount),
  };
}

const emptyStats = (): DashboardStats => normalizeStats(undefined);

/** Plain DB reads — no unstable_cache (avoids Decimal/Date serialization crashes on Render). */
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT
        (SELECT COUNT(*)::int FROM tenants) AS tenants,
        (SELECT COUNT(*)::int FROM clients) AS clients,
        (SELECT COUNT(*)::int FROM trading_accounts WHERE is_active = true) AS accounts,
        (SELECT COUNT(*)::int FROM tickets
          WHERE status IN ('New', 'Open', 'Pending', 'In Progress')) AS "openTickets",
        (SELECT COUNT(*)::int FROM transactions
          WHERE type::text = 'DEPOSIT' AND status::text IN ('PENDING', 'PROCESSING')) AS "pendingDeposits",
        (SELECT COUNT(*)::int FROM transactions
          WHERE type::text = 'WITHDRAW' AND status::text IN ('PENDING', 'PROCESSING')) AS "pendingWithdraws",
        (SELECT COUNT(*)::int FROM kyc_documents WHERE status = 'PENDING') AS "pendingKyc",
        (SELECT COALESCE(SUM(balance), 0)::float FROM trading_accounts WHERE is_active = true) AS aum,
        (SELECT COALESCE(SUM(amount), 0)::float FROM transactions
          WHERE type::text = 'DEPOSIT' AND status::text IN ('PENDING', 'PROCESSING')) AS "pendingDepositAmount",
        (SELECT COALESCE(SUM(amount), 0)::float FROM transactions
          WHERE type::text = 'WITHDRAW' AND status::text IN ('PENDING', 'PROCESSING')) AS "pendingWithdrawAmount"
    `);
    return normalizeStats(rows[0]);
  } catch (err) {
    console.error("getDashboardStats failed:", err);
    return emptyStats();
  }
}

export async function getRecentTransactions(): Promise<DashboardTx[]> {
  try {
    const rows = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        status: true,
        amount: true,
        currency: true,
        createdAt: true,
        client: { select: { email: true, firstName: true, lastName: true } },
        tenant: { select: { slug: true } },
      },
    });
    return rows.map((t) => ({
      id: t.id,
      type: String(t.type),
      status: String(t.status),
      amount: statNum(t.amount),
      currency: t.currency || "USD",
      createdAt: t.createdAt.toISOString(),
      client: {
        email: t.client.email,
        firstName: t.client.firstName || "",
        lastName: t.client.lastName || "",
      },
      tenant: { slug: t.tenant.slug },
    }));
  } catch (err) {
    console.error("getRecentTransactions failed:", err);
    return [];
  }
}

export async function getPendingApprovals(): Promise<{
  txs: PendingApprovalTx[];
  kyc: PendingApprovalKyc[];
}> {
  try {
    const [txs, kyc] = await Promise.all([
      prisma.transaction.findMany({
        where: { status: { in: ["PENDING", "PROCESSING"] } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          type: true,
          amount: true,
          currency: true,
          createdAt: true,
          client: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.kycDocument.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          documentType: true,
          createdAt: true,
          client: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
    ]);
    return {
      txs: txs.map((t) => ({
        id: t.id,
        type: String(t.type),
        amount: statNum(t.amount),
        currency: t.currency || "USD",
        createdAt: t.createdAt.toISOString(),
        client: {
          id: t.client.id,
          firstName: t.client.firstName || "",
          lastName: t.client.lastName || "",
        },
      })),
      kyc: kyc.map((d) => ({
        id: d.id,
        documentType: d.documentType || "Document",
        createdAt: d.createdAt.toISOString(),
        client: {
          id: d.client.id,
          firstName: d.client.firstName || "",
          lastName: d.client.lastName || "",
        },
      })),
    };
  } catch (err) {
    console.error("getPendingApprovals failed:", err);
    return { txs: [], kyc: [] };
  }
}
