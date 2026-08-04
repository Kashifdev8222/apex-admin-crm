import {
  saveAiGlobalSettings,
  setAiEmergencyStop,
  toggleClientAi,
} from "@/app/actions";
import { AiToggleForm } from "@/components/AiToggleForm";
import { getAiSettings, clientHasAi } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";

export default async function AiControlPage() {
  const [ai, clients] = await Promise.all([
    getAiSettings(),
    prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        tags: true,
        accounts: {
          where: { isActive: true },
          select: { balance: true, currency: true },
          take: 1,
        },
      },
    }),
  ]);

  const aiOn = clients.filter((c) => clientHasAi(c.tags)).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>AI Control Panel</h1>
        </div>
      </div>

      <div className="estop">
        <div>
          <h3>Emergency stop</h3>
          <p>
            Instantly halts all AI trading across the platform. All positions
            closed at market.
            {ai.emergencyStop ? (
              <strong style={{ display: "block", marginTop: 8 }}>
                AI trading is currently STOPPED.
              </strong>
            ) : null}
          </p>
        </div>
        {ai.emergencyStop ? (
          <form action={setAiEmergencyStop}>
            <input type="hidden" name="stop" value="false" />
            <button type="submit" className="btn btn-success">
              Resume AI trading
            </button>
          </form>
        ) : (
          <form action={setAiEmergencyStop}>
            <input type="hidden" name="stop" value="true" />
            <button type="submit" className="btn-estop">
              Emergency stop
            </button>
          </form>
        )}
      </div>

      <div className="kpi-strip-4">
        <div className="kpi-card">
          <div className="kpi-lbl">Active AI sessions</div>
          <div className="kpi-val">{aiOn}</div>
          <div className="kpi-meta ok">
            {ai.emergencyStop ? "Emergency stop ON" : "Systems running"}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Users with AI</div>
          <div className="kpi-val">{aiOn}</div>
          <div className="kpi-meta muted">of {clients.length} listed</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Max daily trades</div>
          <div className="kpi-val">{ai.maxDailyTrades}</div>
          <div className="kpi-meta muted">Global cap</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-lbl">Max leverage</div>
          <div className="kpi-val">{ai.maxLeverage}</div>
          <div className="kpi-meta muted">AI default</div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 32 }}>
        <form action={saveAiGlobalSettings}>
          <div className="panel-head">
            <h2>Global parameters</h2>
            <button type="submit" className="btn btn-primary btn-sm">
              Save changes
            </button>
          </div>
          <div className="panel-body">
            <div className="ai-params">
              <div>
                <label className="form-label">Position size %</label>
                <input
                  className="input"
                  type="number"
                  name="positionSizePct"
                  defaultValue={ai.positionSizePct}
                  step="0.1"
                />
              </div>
              <div>
                <label className="form-label">Stop loss %</label>
                <input
                  className="input"
                  type="number"
                  name="stopLossPct"
                  defaultValue={ai.stopLossPct}
                  step="0.1"
                />
              </div>
              <div>
                <label className="form-label">Take profit %</label>
                <input
                  className="input"
                  type="number"
                  name="takeProfitPct"
                  defaultValue={ai.takeProfitPct}
                  step="0.1"
                />
              </div>
              <div>
                <label className="form-label">Max drawdown %</label>
                <input
                  className="input"
                  type="number"
                  name="maxDrawdownPct"
                  defaultValue={ai.maxDrawdownPct}
                />
              </div>
              <div>
                <label className="form-label">Max daily trades</label>
                <input
                  className="input"
                  type="number"
                  name="maxDailyTrades"
                  defaultValue={ai.maxDailyTrades}
                />
              </div>
              <div>
                <label className="form-label">Max leverage</label>
                <select
                  className="input"
                  name="maxLeverage"
                  defaultValue={ai.maxLeverage}
                >
                  <option value="1:100">1:100</option>
                  <option value="1:200">1:200</option>
                  <option value="1:500">1:500</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>Per-user overrides</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="sr-col">#</th>
                <th>User</th>
                <th>Balance</th>
                <th>AI</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => {
                const on = clientHasAi(c.tags);
                const bal = c.accounts[0]
                  ? money(Number(c.accounts[0].balance), c.accounts[0].currency)
                  : "—";
                return (
                  <tr key={c.id}>
                    <td className="sr-col">{i + 1}</td>
                    <td style={{ fontWeight: 500 }}>
                      {c.firstName} {c.lastName}
                      <div className="muted">{c.email}</div>
                    </td>
                    <td>{bal}</td>
                    <td>
                      <AiToggleForm
                        id={c.id}
                        enabled={on}
                        action={toggleClientAi}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
