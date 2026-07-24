import { AppShell } from "@/components/AppShell";
import { requireUser } from "@/lib/session";

/**
 * Persistent shell for all ops pages.
 * Sidebar/topbar stay mounted — only the content area swaps (fast nav).
 */
export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
