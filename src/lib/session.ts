import { redirect } from "next/navigation";
import { readSession } from "@/lib/auth";

/** Shared auth gate for app pages. Each page wraps content with AppShell + title. */
export async function requireUser() {
  const session = await readSession();
  if (!session) redirect("/login");
  return session;
}
