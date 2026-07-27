import { Suspense } from "react";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import {
  getDashboardStats,
  getPendingApprovals,
  getRecentTransactions,
} from "@/lib/dashboard-data";
import { capitalize, fmtDate, money } from "@/lib/format";

export const dynamic = "force-dynamic";

function greetingHour() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function fmtCompact(n: number) {
  const v = Number.isFinite(n) ? n : 0;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return money(v, "USD");
}

function StatsSkeleton() {
  return (
    <div className="kpi-grid">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="kpi-card skeleton-block" style={{ minHeight: 110 }} />
      ))}
    </div>
  );
}

function PanelsSkeleton() {
  return (
    <div className="grid-2">
      <div className="dash-panel skeleton-block" style={{ minHeight: 280 }} />
      <div className="dash-panel skeleton-block" style={{ minHeight: 280 }} />
    </div>
  );
}

async function DashboardStatsBlock() {
  try {
    const s = await getDashboardStats();
    return (
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-lbl">Total users</div>
          <div className="kpi-val">{s.clients.toLocaleString()}</div>
          <div className="kpi-meta muted">
            {s.tenants} tenant{s.tenants === 1 ? "" : "s"}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Active traders</div>
          <div className="kpi-val">{s.accounts.toLocaleString()}</div>
          <div className="kpi-meta ok">Active accounts</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Platform AUM</div>
          <div className="kpi-val">{fmtCompact(s.aum)}</div>
          <div className="kpi-meta muted">Sum of balances</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Open tickets</div>
          <div className="kpi-val">{s.openTickets}</div>
          <div className="kpi-meta warn">{s.pendingKyc} KYC pending</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Pending deposits</div>
          <div className="kpi-val">{s.pendingDeposits}</div>
          <div className="kpi-meta warn">
            {fmtCompact(s.pendingDepositAmount)} awaiting
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Pending withdrawals</div>
          <div className="kpi-val">{s.pendingWithdraws}</div>
          <div className="kpi-meta bad">
            {fmtCompact(s.pendingWithdrawAmount)} awaiting
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error("DashboardStatsBlock failed:", err);
    return (
      <div className="dash-panel" style={{ marginBottom: 24 }}>
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Stats temporarily unavailable.
        </p>
      </div>
    );
  }
}

async function DashboardPanels() {
  try {
    const [{ txs, kyc }, recentTx] = await Promise.all([
      getPendingApprovals(),
      getRecentTransactions(),
    ]);

    type ApprovalRow = {
      key: string;
      name: string;
      kind: string;
      amountLabel: string;
      amountClass: string;
      when: string;
      href: string;
    };

    const approvals: ApprovalRow[] = [
      ...txs.map((t) => ({
        key: `tx-${t.id}`,
        name: `${t.client.firstName} ${t.client.lastName}`.trim() || "Client",
        kind: t.type === "DEPOSIT" ? "Deposit" : "Withdrawal",
        amountLabel:
          (t.type === "DEPOSIT" ? "+" : "-") + money(t.amount, t.currency),
        amountClass: t.type === "DEPOSIT" ? "ok" : "bad",
        when: t.createdAt,
        href: t.type === "DEPOSIT" ? "/deposits" : "/withdrawals",
      })),
      ...kyc.map((d) => ({
        key: `kyc-${d.id}`,
        name: `${d.client.firstName} ${d.client.lastName}`.trim() || "Client",
        kind: "KYC",
        amountLabel: d.documentType || "Document",
        amountClass: "muted",
        when: d.createdAt,
        href: "/kyc",
      })),
    ]
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
      .slice(0, 6);

    return (
      <div className="grid-2">
        <div className="dash-panel">
          <div className="dash-panel__title">Pending approvals</div>
          {approvals.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              Nothing waiting for review.
            </p>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 0.8fr 1fr 0.9fr 0.7fr",
                  gap: 12,
                  alignItems: "center",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  padding: "0 0 10px",
                  marginBottom: 12,
                  borderBottom: "1px solid #e2e7ee",
                }}
              >
                <div>Name</div>
                <div>Type</div>
                <div>Amount</div>
                <div>Time</div>
                <div>Action</div>
              </div>
              {approvals.map((row) => (
                <div
                  key={row.key}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 0.8fr 1fr 0.9fr 0.7fr",
                    gap: 12,
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #eef1f5",
                  }}
                >
                  <div style={{ fontWeight: 500, fontSize: 12 }} className="cap">
                    {row.name}
                  </div>
                  <div style={{ fontSize: 11 }}>{row.kind}</div>
                  <div
                    style={{ fontWeight: 600, fontSize: 12 }}
                    className={
                      row.amountClass === "ok"
                        ? "kpi-meta ok"
                        : row.amountClass === "bad"
                          ? "kpi-meta bad"
                          : undefined
                    }
                  >
                    {row.amountLabel}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    {fmtDate(row.when)}
                  </div>
                  <div>
                    <Link href={row.href} className="btn btn-outline btn-xs">
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="dash-panel">
          <div className="dash-panel__title">Recent activity</div>
          {recentTx.length === 0 ? (
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              No recent transactions.
            </p>
          ) : (
            recentTx.map((t) => {
              const isDep = t.type === "DEPOSIT";
              return (
                <div className="activity-row" key={t.id}>
                  <span
                    className={`badge ${isDep ? "badge-blue" : "badge-amber"}`}
                  >
                    {capitalize(t.type)}
                  </span>
                  <span className="act-label">
                    {t.client.firstName} {t.client.lastName} · {t.tenant.slug}
                  </span>
                  <span
                    className="act-amt"
                    style={{ color: isDep ? "#10b981" : "#ef4444" }}
                  >
                    {isDep ? "+" : "-"}
                    {money(t.amount, t.currency)}
                  </span>
                  <span className="act-time">{fmtDate(t.createdAt)}</span>
                </div>
              );
            })
          )}
          <div style={{ marginTop: 16 }}>
            <Link
              href="/transactions"
              style={{ fontSize: 12, color: "#024c8d", fontWeight: 500 }}
            >
              View all transactions →
            </Link>
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error("DashboardPanels failed:", err);
    return (
      <div className="dash-panel">
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Activity temporarily unavailable.
        </p>
      </div>
    );
  }
}

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.firstName || "Admin";

  return (
    <>
      <div className="page-intro">
        <h2>
          {greetingHour()}, <span className="cap">{firstName}</span>
        </h2>
        <p>Here&apos;s what&apos;s happening across your platform today.</p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStatsBlock />
      </Suspense>

      <Suspense fallback={<PanelsSkeleton />}>
        <DashboardPanels />
      </Suspense>
    </>
  );
}
