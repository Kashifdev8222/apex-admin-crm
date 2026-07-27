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

/** One DB round-trip for all dashboard counters (cached 45s). */
export const getDashboardStats = unstable_cache(
  async (): Promise<DashboardStats> => {
    const rows = await prisma.$queryRaw<DashboardStats[]>(Prisma.sql`
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
    return (
      rows[0] ?? {
        tenants: 0,
        clients: 0,
        accounts: 0,
        openTickets: 0,
        pendingDeposits: 0,
        pendingWithdraws: 0,
        pendingKyc: 0,
        aum: 0,
        pendingDepositAmount: 0,
        pendingWithdrawAmount: 0,
      }
    );
  },
  ["dashboard-stats-v2"],
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
