import { StatusBadge } from "@/components/StatusBadge";
import { EditRowModal } from "@/components/EditRowModal";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/format";
import { savePlatformSettingsAction, updateTenant } from "@/app/actions";
import { getPlatformSettings } from "@/lib/platform-settings";

export default async function TenantsPage() {
  const [rows, settings] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            clients: true,
            accounts: true,
            transactions: true,
            tickets: true,
            staffUsers: true,
          },
        },
      },
    }),
    getPlatformSettings(),
  ]);

  return (
    <>
      <form action={savePlatformSettingsAction}>
        <div className="page-head">
          <div>
            <h1>Platform Settings</h1>
            <div className="breadcrumb">
              <a href="/dashboard">Admin</a> / Settings
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Save all
          </button>
        </div>

        <div className="settings-group">
          <h4>Trading defaults</h4>
          <div className="settings-grid">
            <div>
              <label className="form-label">Default leverage</label>
              <select
                className="input"
                name="defaultLeverage"
                defaultValue={String(settings.defaultLeverage)}
              >
                <option value="100">1:100</option>
                <option value="200">1:200</option>
                <option value="500">1:500</option>
              </select>
            </div>
            <div>
              <label className="form-label">Min deposit (USD)</label>
              <input
                className="input"
                type="number"
                name="minDepositUsd"
                defaultValue={settings.minDepositUsd}
              />
            </div>
            <div>
              <label className="form-label">Max leverage</label>
              <select
                className="input"
                name="maxLeverage"
                defaultValue={String(settings.maxLeverage)}
              >
                <option value="200">1:200</option>
                <option value="500">1:500</option>
              </select>
            </div>
            <div>
              <label className="form-label">Base currency</label>
              <select
                className="input"
                name="baseCurrency"
                defaultValue={settings.baseCurrency}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label className="form-label">Margin call %</label>
              <input
                className="input"
                type="number"
                name="marginCallPct"
                defaultValue={settings.marginCallPct}
              />
            </div>
            <div>
              <label className="form-label">Stop out %</label>
              <input
                className="input"
                type="number"
                name="stopOutPct"
                defaultValue={settings.stopOutPct}
              />
            </div>
          </div>
        </div>

        <div className="settings-group">
          <h4>Fees</h4>
          <div className="settings-grid">
            <div>
              <label className="form-label">Commission ($/lot)</label>
              <input
                className="input"
                type="number"
                name="commissionPerLot"
                defaultValue={settings.commissionPerLot}
              />
            </div>
            <div>
              <label className="form-label">Withdrawal fee ($)</label>
              <input
                className="input"
                type="number"
                name="withdrawalFee"
                defaultValue={settings.withdrawalFee}
              />
            </div>
            <div>
              <label className="form-label">Spread markup</label>
              <input
                className="input"
                type="number"
                name="spreadMarkup"
                defaultValue={settings.spreadMarkup}
                step="0.1"
              />
            </div>
            <div>
              <label className="form-label">Deposit fee %</label>
              <input
                className="input"
                type="number"
                name="depositFeePct"
                defaultValue={settings.depositFeePct}
              />
            </div>
          </div>
        </div>
      </form>

      <div className="panel">
        <div className="panel-head">
          <h2>Tenants</h2>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th className="sr-col">#</th>
                <th>Name</th>
                <th>Slug</th>
                <th>MT Group</th>
                <th>Leverage</th>
                <th>Clients</th>
                <th>Accounts</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t, i) => (
                <tr key={t.id}>
                  <td className="sr-col">{i + 1}</td>
                  <td>{t.name}</td>
                  <td>{t.slug}</td>
                  <td>
                    <code className="mono-cell">{t.defaultMtGroup}</code>
                  </td>
                  <td>{t.defaultLeverage}</td>
                  <td>{t._count.clients}</td>
                  <td>{t._count.accounts}</td>
                  <td>
                    <StatusBadge status={t.isActive ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td>{fmtDate(t.createdAt)}</td>
                  <td>
                    <div className="row-actions">
                      <EditRowModal
                        title={`Edit · ${t.name}`}
                        action={updateTenant}
                        hidden={{ id: t.id }}
                        fields={[
                          {
                            name: "name",
                            label: "Name",
                            defaultValue: t.name,
                            required: true,
                          },
                          {
                            name: "defaultMtGroup",
                            label: "MT group",
                            defaultValue: t.defaultMtGroup,
                            required: true,
                          },
                          {
                            name: "defaultLeverage",
                            label: "Leverage",
                            type: "number",
                            defaultValue: t.defaultLeverage,
                          },
                          {
                            name: "isActive",
                            label: "Status",
                            type: "select",
                            defaultValue: t.isActive ? "true" : "false",
                            options: [
                              { value: "true", label: "Active" },
                              { value: "false", label: "Inactive" },
                            ],
                          },
                        ]}
                      />
                      <form action={updateTenant}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="name" value={t.name} />
                        <input
                          type="hidden"
                          name="defaultMtGroup"
                          value={t.defaultMtGroup}
                        />
                        <input
                          type="hidden"
                          name="defaultLeverage"
                          value={String(t.defaultLeverage)}
                        />
                        <input
                          type="hidden"
                          name="isActive"
                          value={t.isActive ? "false" : "true"}
                        />
                        <button className="btn btn-soft btn-sm" type="submit">
                          {t.isActive ? "Disable" : "Enable"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
