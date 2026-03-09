import { Suspense } from "react";
import { SlidersHorizontal, BarChart2, AlertTriangle } from "lucide-react";
import { getDashboardFilterOptions, getDashboardMetrics, getGlobalNCs, getAuditScoreTrend, getRecentAudits, getUpcomingAudits, getMonthlyKPIs } from "@/features/dashboard/queries/get-dashboard-data";
import { DashboardFilters } from "@/features/dashboard/components/dashboard-filters";
import { DashboardMetricsGrid } from "@/features/dashboard/components/dashboard-metrics";
import { GlobalNCTable } from "@/features/dashboard/components/global-nc-table";
import { AuditTrendChart } from "@/features/dashboard/components/audit-trend-chart";
import { RecentAudits } from "@/features/dashboard/components/recent-audits";
import { UpcomingAuditsWidget } from "@/features/dashboard/components/upcoming-audits-widget";
import { MonthlyKPIs } from "@/features/dashboard/components/monthly-kpis";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const clientId = typeof params.clientId === "string" ? params.clientId : "";
  const locationId = typeof params.locationId === "string" ? params.locationId : "";
  const dateFrom = typeof params.dateFrom === "string" ? params.dateFrom : "";
  const dateTo = typeof params.dateTo === "string" ? params.dateTo : "";

  const filters = { clientId, locationId, dateFrom, dateTo };

  const [filterOptions, metrics, globalNCs, trendData, recentAudits, upcomingAudits, monthlyKPIs] = await Promise.all([
    getDashboardFilterOptions(),
    getDashboardMetrics(filters),
    getGlobalNCs(filters),
    getAuditScoreTrend(filters),
    getRecentAudits(),
    getUpcomingAudits(),
    getMonthlyKPIs(),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Centro di controllo — filtri attivi: {[clientId, locationId, dateFrom, dateTo].filter(Boolean).length} / 4
        </p>
      </div>

      {/* Filters */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-700">Filtri</h2>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <Suspense>
            <DashboardFilters
              clients={filterOptions.clients}
              locations={filterOptions.locations}
              activeClientId={clientId}
              activeLocationId={locationId}
              activeDateFrom={dateFrom}
              activeDateTo={dateTo}
            />
          </Suspense>
        </div>
      </section>

      {/* D1: Monthly KPIs (fixed) */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-700">KPI del mese</h2>
          <p className="text-xs text-zinc-400 ml-auto">Metriche fisse: questo mese, NC globali, ultimi 30gg</p>
        </div>
        <MonthlyKPIs kpis={monthlyKPIs} />
      </section>

            {/* Metrics */}
      <section>
        <DashboardMetricsGrid metrics={metrics} />
      </section>

      {/* Trend chart + NC table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Trend chart */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-700">Trend score audit</h2>
          </div>
          <p className="text-xs text-zinc-400 mb-4">
            Score medio per audit nel periodo — verde ≥ 85%, giallo ≥ 70%, rosso &lt; 70%
          </p>
          <AuditTrendChart data={trendData} />
        </section>

        {/* NC Summary (compact) */}
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-700">
              Riepilogo NC
            </h2>
          </div>
          <div className="space-y-2">
            {globalNCs.length === 0 ? (
              <p className="text-sm text-zinc-400">
                Nessuna NC per i filtri selezionati.
              </p>
            ) : (
              globalNCs.slice(0, 6).map((nc) => (
                <div
                  key={nc.id}
                  className="flex items-start justify-between gap-2 text-sm border-b border-zinc-50 pb-2 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-800 truncate">{nc.title}</p>
                    <p className="text-xs text-zinc-400 truncate">
                      {nc.clientName} · {nc.auditTitle}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold whitespace-nowrap ${
                      nc.severity === "critical"
                        ? "bg-red-100 text-red-700"
                        : nc.severity === "major"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {nc.severity === "critical"
                      ? "Critica"
                      : nc.severity === "major"
                        ? "Maggiore"
                        : "Minore"}
                  </span>
                </div>
              ))
            )}
            {globalNCs.length > 6 && (
              <p className="text-xs text-zinc-400 pt-1">
                + {globalNCs.length - 6} altre NC nella tabella sotto
              </p>
            )}
          </div>
        </section>
      </div>


      {/* D2: Recent Audits */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <BarChart2 className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-700">Ultimi 5 audit</h2>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <RecentAudits audits={recentAudits} />
        </div>
      </section>

      {/* D3: Upcoming Audits Alert */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-700">Audit in scadenza (7 giorni)</h2>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <UpcomingAuditsWidget audits={upcomingAudits} />
        </div>
      </section>

            {/* Global NC Table */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-700">
            Non conformità — vista globale
          </h2>
        </div>
        <GlobalNCTable nonConformities={globalNCs} />
      </section>
    </div>
  );
}
