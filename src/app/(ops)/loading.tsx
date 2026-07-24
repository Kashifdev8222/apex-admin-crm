import { PageSkeleton } from "@/components/PageSkeleton";

/** Content-only skeleton — shell stays visible (no full-page preload). */
export default function OpsLoading() {
  return <PageSkeleton />;
}
