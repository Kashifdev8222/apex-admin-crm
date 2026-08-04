import { AppShell } from "@/components/AppShell";
import type { NotifItem } from "@/components/NotificationsBell";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  void prisma.$queryRaw`SELECT 1`.catch(() => undefined);

  let notifications: NotifItem[] = [];
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
          createdAt: true,
          client: { select: { firstName: true, lastName: true } },
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
          client: { select: { firstName: true, lastName: true } },
        },
      }),
    ]);

    notifications = [
      ...txs.map((t) => ({
        id: `tx-${t.id}`,
        title: t.type === "DEPOSIT" ? "Pending deposit" : "Pending withdrawal",
        detail: `$${Number(t.amount).toLocaleString()} from ${t.client.firstName} ${t.client.lastName}`,
        href: t.type === "DEPOSIT" ? "/deposits" : "/withdrawals",
        tone: t.type === "DEPOSIT" ? "#0ea5e9" : "#f59e0b",
        when: fmtDate(t.createdAt),
      })),
      ...kyc.map((d) => ({
        id: `kyc-${d.id}`,
        title: "New KYC upload",
        detail: `${d.client.firstName} ${d.client.lastName} · ${d.documentType}`,
        href: "/kyc",
        tone: "#0ea5e9",
        when: fmtDate(d.createdAt),
      })),
    ].slice(0, 8);
  } catch {
    notifications = [];
  }

  return (
    <AppShell user={user} notifications={notifications}>
      {children}
    </AppShell>
  );
}
