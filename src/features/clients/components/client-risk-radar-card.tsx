import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ClientRiskRadarData } from "@/features/clients/queries/get-client-risk-radar";

function formatDelta(scoreDelta: number | null) {
  if (scoreDelta === null || scoreDelta === 0) {
    return "Stabile";
  }

  const prefix = scoreDelta > 0 ? "+" : "";
  return `${prefix}${Math.round(scoreDelta)} pt`;
}

export function ClientRiskRadarCard({ data }: { data: ClientRiskRadarData | null }) {
  const radar = data?.radar ?? null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          Risk Radar
        </CardTitle>
        <CardDescription>Lettura sintetica della pressione operativa attuale.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!radar ? (
          <p className="text-sm text-slate-500">Radar non disponibile.</p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-bold text-slate-900">{radar.score}</p>
                <p className="mt-1 text-sm text-slate-500">{radar.summary}</p>
              </div>
              <Badge variant="outline" className={radar.className}>
                {radar.label}
              </Badge>
            </div>
            <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 md:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Score medio audit
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {data?.averageAuditScore === null || data?.averageAuditScore === undefined
                    ? "N/D"
                    : `${Math.round(data.averageAuditScore)}%`}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Delta recente
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {formatDelta(data?.scoreDelta ?? null)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Audit in agenda
                </p>
                <p className="mt-1 text-base font-semibold text-slate-900">
                  {data?.upcomingAuditCount ?? 0}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {radar.drivers.length === 0 ? (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  Nessuna pressione critica
                </Badge>
              ) : (
                radar.drivers.map((driver) => (
                  <Badge
                    key={driver.label}
                    variant="outline"
                    className={
                      driver.tone === "danger"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"
                    }
                  >
                    {driver.label}
                  </Badge>
                ))
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
