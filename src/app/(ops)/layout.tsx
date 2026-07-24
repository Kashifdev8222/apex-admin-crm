import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Persistent shell for all ops pages.
 * Sidebar/topbar stay mounted — only the content area swaps (fast nav).
 * Tiny DB ping keeps the pool warm so the next page is not a cold connect.
 */
export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  void prisma.$queryRaw`SELECT 1`.catch(() => undefined);
  return <AppShell user={user}>{children}</AppShell>;
}
