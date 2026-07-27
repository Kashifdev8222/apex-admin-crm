import { unstable_cache } from "next/cache";
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

function statNum(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
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

/** One DB round-trip for all dashboard counters (cached 45s). */
export const getDashboardStats = unstable_cache(
  async (): Promise<DashboardStats> => {
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
      return normalizeStats(undefined);
    }
  },
  ["dashboard-stats-v3"],
  { revalidate: 45, tags: ["dashboard"] },
);

export const getRecentTransactions = unstable_cache(
  async () => {
    return prisma.transaction.findMany({
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
  },
  ["dashboard-recent-tx-v1"],
  { revalidate: 20, tags: ["dashboard"] },
);

export const getPendingApprovals = unstable_cache(
  async () => {
    const [txs, kyc] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          status: { in: ["PENDING", "PROCESSING"] },
        },
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
    return { txs, kyc };
  },
  ["dashboard-pending-v1"],
  { revalidate: 20, tags: ["dashboard"] },
);
