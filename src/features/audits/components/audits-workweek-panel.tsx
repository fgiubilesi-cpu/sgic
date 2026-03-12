import Link from "next/link";
import { CalendarRange, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAuditRiskSignals,
  getAuditsWorkweek,
} from "@/features/audits/lib/audits-list";
import type { AuditWithNCCount } from "@/features/audits/queries/get-audits";
import { cn } from "@/lib/utils";

type AuditsWorkweekPanelProps = {
  audits: AuditWithNCCount[];
};

function formatStatus(status: AuditWithNCCount["status"]): { label: string; className: string } {
  switch (status) {
    case "Scheduled":
      return { label: "Pianificato", className: "border-slate-200 bg-slate-50 text-slate-700" };
    case "In Progress":
      return { label: "In corso", className: "border-blue-200 bg-blue-50 text-blue-700" };
    case "Review":
      return { label: "Review", className: "border-amber-200 bg-amber-50 text-amber-700" };
    case "Closed":
      return { label: "Chiuso", className: "border-green-200 bg-green-50 text-green-700" };
    default:
      return { label: status, className: "border-zinc-200 bg-zinc-50 text-zinc-700" };
  }
}

export function AuditsWorkweekPanel({ audits }: AuditsWorkweekPanelProps) {
  const days = getAuditsWorkweek(audits);
  const totalScheduled = days.reduce((total, day) => total + day.audits.length, 0);

  return (
    <Card className="rounded-2xl border-zinc-200 shadow-sm">
      <CardHeader className="flex flex-col gap-4 border-b border-zinc-100 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base text-zinc-900">
            <CalendarRange className="h-4 w-4 text-zinc-500" />
            Settimana audit
          </CardTitle>
          <p className="text-sm text-zinc-500">
            Prossimi 5 giorni lavorativi con tutti gli audit schedulati.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-zinc-600">
            {totalScheduled} audit in agenda
          </Badge>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-zinc-600">
            {days[0]?.label ?? "Settimana"} - {days[days.length - 1]?.label ?? ""}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {days.map((day) => (
            <section
              key={day.id}
              className={cn(
                "flex min-h-[240px] flex-col rounded-2xl border bg-zinc-50/70 p-4",
                day.isToday ? "border-emerald-200 bg-emerald-50/60" : "border-zinc-200"
              )}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {day.shortLabel.replace(".", "")}
                  </div>
                  <div className="mt-1 text-sm font-semibold capitalize text-zinc-900">
                    {day.label}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {day.isToday ? (
                    <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">
                      Oggi
                    </Badge>
                  ) : null}
                  <Badge variant="secondary" className="rounded-full">
                    {day.audits.length} audit
                  </Badge>
                </div>
              </div>

              {day.audits.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white/80 px-4 py-6 text-center text-sm text-zinc-500">
                  Nessun audit schedulato
                </div>
              ) : (
                <div className="space-y-3">
                  {day.audits.map((audit) => {
                    const status = formatStatus(audit.status);
                    const signals = getAuditRiskSignals(audit).slice(0, 2);

                    return (
                      <Link
                        key={audit.id}
                        href={`/audits/${audit.id}`}
                        className="group block rounded-xl border border-zinc-200 bg-white p-3 transition hover:border-zinc-300 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="line-clamp-2 text-sm font-semibold text-zinc-900">
                              {audit.title ?? "Audit senza titolo"}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {audit.client_name ?? "Cliente non assegnato"}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {audit.location_name ?? "Sede non assegnata"}
                            </div>
                          </div>

                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 transition group-hover:text-zinc-500" />
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <Badge variant="outline" className={cn("rounded-full", status.className)}>
                            {status.label}
                          </Badge>
                          {signals.map((signal) => (
                            <Badge
                              key={signal.key}
                              variant="outline"
                              className={cn("rounded-full", signal.tone)}
                            >
                              {signal.label}
                            </Badge>
                          ))}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
