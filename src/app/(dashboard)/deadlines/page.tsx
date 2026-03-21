import { Suspense } from "react";
import { Clock } from "lucide-react";
import { getUnifiedDeadlines } from "@/features/deadlines/queries/get-unified-deadlines";
import { DeadlinesClient } from "@/features/deadlines/components/deadlines-client";
import { getDashboardFilterOptions } from "@/features/dashboard/queries/get-dashboard-data";
import { DashboardFilters } from "@/features/dashboard/components/dashboard-filters";

export const dynamic = "force-dynamic";

export default async function DeadlinesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const clientId = typeof params.clientId === "string" ? params.clientId : "";

  const [deadlines, filterOptions] = await Promise.all([
    getUnifiedDeadlines({ clientId: clientId || undefined }),
    getDashboardFilterOptions(),
  ]);

  const overdueCount = deadlines.filter((d) => d.urgency === "overdue").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-zinc-400" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Scadenze
          </h1>
          {overdueCount > 0 && (
            <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
              {overdueCount} scadute
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Vista unificata — visite mediche, attestati, audit, documenti e azioni correttive.
          Finestra: scadute fino a 1 anno fa + prossimi 90 giorni.
        </p>
      </div>

      {/* Filtro cliente */}
      {filterOptions.clients.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <Suspense>
            <DashboardFilters
              clients={filterOptions.clients}
              locations={[]}
              activeClientId={clientId}
              activeLocationId=""
              activeDateFrom=""
              activeDateTo=""
            />
          </Suspense>
        </div>
      )}

      {/* Contenuto interattivo (KPI strip + filtri + tabella) */}
      <DeadlinesClient deadlines={deadlines} />
    </div>
  );
}
