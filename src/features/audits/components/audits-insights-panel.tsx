import { AlertTriangle, CalendarRange, MapPinned, TrendingUp, UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AuditsListInsights } from "@/features/audits/lib/audits-list";
import { getAuditRiskSignals } from "@/features/audits/lib/audits-list";

type AuditsInsightsPanelProps = {
  insights: AuditsListInsights;
};

function formatDate(value: string | null): string {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function AuditsInsightsPanel({ insights }: AuditsInsightsPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
      <Card className="gap-4 rounded-2xl py-5 shadow-sm">
        <CardHeader className="px-5 pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="h-4 w-4 text-zinc-500" />
            Planner snapshot
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5">
          {insights.upcoming.length === 0 ? (
            <p className="text-sm text-zinc-500">No upcoming audits in the current view.</p>
          ) : (
            <div className="space-y-3">
              {insights.upcoming.map((audit) => {
                const signals = getAuditRiskSignals(audit);
                return (
                  <div
                    key={audit.id}
                    className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3"
                  >
                    <div className="space-y-1">
                      <div className="font-medium text-zinc-900">{audit.title}</div>
                      <div className="text-sm text-zinc-500">
                        {audit.client_name ?? "No client"} · {audit.location_name ?? "No location"}
                      </div>
                    </div>
                    <div className="min-w-fit space-y-2 text-right">
                      <div className="text-sm font-medium text-zinc-700">
                        {formatDate(audit.scheduled_date)}
                      </div>
                      <div className="flex flex-wrap justify-end gap-1">
                        {signals.slice(0, 2).map((signal) => (
                          <Badge
                            key={signal.key}
                            variant="outline"
                            className={`rounded-full ${signal.tone}`}
                          >
                            {signal.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-4 rounded-2xl py-5 shadow-sm">
        <CardHeader className="px-5 pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <UsersRound className="h-4 w-4 text-zinc-500" />
            Client trend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5">
          {insights.clientTrends.map((item) => (
            <TrendRow
              key={item.id}
              label={item.label}
              value={`${item.audits} audits`}
              secondary={item.avgScore !== null ? `${item.avgScore}% avg` : "No score yet"}
              warning={item.openNc > 0 ? `${item.openNc} open NC` : "No open NC"}
            />
          ))}
        </CardContent>
      </Card>

      <Card className="gap-4 rounded-2xl py-5 shadow-sm">
        <CardHeader className="px-5 pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPinned className="h-4 w-4 text-zinc-500" />
            Location trend
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5">
          <div className="grid grid-cols-3 gap-2 pb-2">
            <MiniAlert
              icon={AlertTriangle}
              label="Attention"
              value={insights.attentionCount}
              tone="text-rose-700"
            />
            <MiniAlert
              icon={TrendingUp}
              label="Low score"
              value={insights.lowScoreCount}
              tone="text-orange-700"
            />
            <MiniAlert
              icon={CalendarRange}
              label="Overdue"
              value={insights.overdueCount}
              tone="text-amber-700"
            />
          </div>
          {insights.locationTrends.map((item) => (
            <TrendRow
              key={item.id}
              label={item.label}
              value={`${item.audits} audits`}
              secondary={item.avgScore !== null ? `${item.avgScore}% avg` : "No score yet"}
              warning={item.openNc > 0 ? `${item.openNc} open NC` : "No open NC"}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TrendRow({
  label,
  value,
  secondary,
  warning,
}: {
  label: string;
  value: string;
  secondary: string;
  warning: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
      <div className="font-medium text-zinc-900">{label}</div>
      <div className="mt-1 text-sm text-zinc-500">{value}</div>
      <div className="mt-1 text-sm text-zinc-600">{secondary}</div>
      <div className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
        {warning}
      </div>
    </div>
  );
}

function MiniAlert({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof AlertTriangle;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">{label}</span>
        <Icon className={`h-4 w-4 ${tone}`} />
      </div>
      <div className={`mt-2 text-2xl font-semibold ${tone}`}>{value}</div>
    </div>
  );
}
