"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAuditRiskSignals,
  getAuditsMonth,
  getAuditsWorkweek,
} from "@/features/audits/lib/audits-list";
import type { AuditWithNCCount } from "@/features/audits/queries/get-audits";
import { cn } from "@/lib/utils";

type AuditsWorkweekPanelProps = {
  audits: AuditWithNCCount[];
};

type PlannerViewMode = "week" | "month";
type PlannerFilter = "all" | "busy" | "attention" | "open_nc";

const PLANNER_FILTERS: Array<{ id: PlannerFilter; label: string }> = [
  { id: "all", label: "Tutti" },
  { id: "busy", label: "Solo con audit" },
  { id: "attention", label: "Con criticita" },
  { id: "open_nc", label: "NC aperte" },
];

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

function matchesPlannerFilter(audit: AuditWithNCCount, filter: PlannerFilter): boolean {
  if (filter === "all" || filter === "busy") return true;
  if (filter === "open_nc") return audit.nc_count > 0;
  return getAuditRiskSignals(audit).length > 0;
}

function shiftReferenceDate(current: Date, viewMode: PlannerViewMode, direction: -1 | 1): Date {
  if (viewMode === "week") {
    const nextDate = new Date(current);
    nextDate.setDate(nextDate.getDate() + direction * 7);
    return nextDate;
  }

  return new Date(current.getFullYear(), current.getMonth() + direction, 1);
}

function formatRangeLabel(
  mode: PlannerViewMode,
  startLabel: string | undefined,
  endLabel: string | undefined,
  referenceDate: Date
): string {
  if (mode === "month") {
    return new Intl.DateTimeFormat("it-IT", {
      month: "long",
      year: "numeric",
    }).format(referenceDate);
  }

  return `${startLabel ?? "Settimana"} - ${endLabel ?? ""}`;
}

function getPlannerDescription(mode: PlannerViewMode): string {
  if (mode === "month") {
    return "Vista mensile degli audit schedulati, raggruppati per giorno operativo.";
  }

  return "Prossimi 5 giorni lavorativi con tutti gli audit schedulati.";
}

export function AuditsWorkweekPanel({ audits }: AuditsWorkweekPanelProps) {
  const [viewMode, setViewMode] = useState<PlannerViewMode>("week");
  const [plannerFilter, setPlannerFilter] = useState<PlannerFilter>("all");
  const [referenceDate, setReferenceDate] = useState(() => new Date());

  useEffect(() => {
    setPlannerFilter(viewMode === "month" ? "busy" : "all");
  }, [viewMode]);

  const allDays =
    viewMode === "week"
      ? getAuditsWorkweek(audits, referenceDate)
      : getAuditsMonth(audits, referenceDate);

  const filteredDays = allDays.map((day) => ({
    ...day,
    audits: day.audits.filter((audit) => matchesPlannerFilter(audit, plannerFilter)),
  }));

  const visibleDays =
    viewMode === "week" && plannerFilter === "all"
      ? filteredDays
      : filteredDays.filter((day) => day.audits.length > 0);

  const totalAudits = filteredDays.reduce((total, day) => total + day.audits.length, 0);
  const totalOpenNc = filteredDays.reduce(
    (total, day) =>
      total + day.audits.reduce((dayTotal, audit) => dayTotal + audit.nc_count, 0),
    0
  );
  const attentionAudits = filteredDays.reduce(
    (total, day) =>
      total + day.audits.filter((audit) => getAuditRiskSignals(audit).length > 0).length,
    0
  );
  const rangeLabel = formatRangeLabel(
    viewMode,
    allDays[0]?.label,
    allDays[allDays.length - 1]?.label,
    referenceDate
  );

  return (
    <Card className="rounded-2xl border-zinc-200 shadow-sm">
      <CardHeader className="gap-5 border-b border-zinc-100 pb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base text-zinc-900">
              <CalendarRange className="h-4 w-4 text-zinc-500" />
              Agenda audit
            </CardTitle>
            <p className="text-sm text-zinc-500">{getPlannerDescription(viewMode)}</p>
          </div>

          <div className="flex flex-col items-start gap-3 xl:items-end">
            <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1">
              {(["week", "month"] as PlannerViewMode[]).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-8 rounded-lg px-3 text-xs font-medium",
                    viewMode === mode
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900"
                  )}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === "week" ? "Settimana" : "Mese"}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setReferenceDate((current) => shiftReferenceDate(current, viewMode, -1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Prec.
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setReferenceDate(new Date())}
              >
                Oggi
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9"
                onClick={() => setReferenceDate((current) => shiftReferenceDate(current, viewMode, 1))}
              >
                Succ.
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {PLANNER_FILTERS.map((filter) => (
              <Button
                key={filter.id}
                type="button"
                size="sm"
                variant={plannerFilter === filter.id ? "default" : "outline"}
                className="h-8 rounded-full px-3"
                onClick={() => setPlannerFilter(filter.id)}
              >
                {filter.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-zinc-600">
              {totalAudits} audit visibili
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-zinc-600">
              {attentionAudits} con attenzione
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-zinc-600">
              {totalOpenNc} NC aperte
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs text-zinc-600">
              {rangeLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5">
        {visibleDays.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/70 px-6 py-12 text-center">
            <div className="text-sm font-medium text-zinc-900">Nessun audit nella vista corrente</div>
            <p className="mt-2 text-sm text-zinc-500">
              Prova un altro periodo oppure rimuovi i filtri intelligenti dell&apos;agenda.
            </p>
          </div>
        ) : viewMode === "week" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {visibleDays.map((day) => (
              <PlannerDayCard key={day.id} day={day} compact={false} />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {visibleDays.map((day) => (
              <PlannerDayCard key={day.id} day={day} compact />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PlannerDayCard({
  day,
  compact,
}: {
  day: ReturnType<typeof getAuditsWorkweek>[number];
  compact: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border p-4",
        compact ? "border-zinc-200 bg-white" : "min-h-[240px] border-zinc-200 bg-zinc-50/70",
        day.isToday && "border-emerald-200 bg-emerald-50/60"
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {day.shortLabel.replace(".", "")}
          </div>
          <div className="mt-1 text-sm font-semibold capitalize text-zinc-900">{day.label}</div>
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
        <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-white/80 px-4 py-6 text-center text-sm text-zinc-500">
          Nessun audit schedulato
        </div>
      ) : (
        <div className="space-y-3">
          {day.audits.map((audit) => (
            <PlannerAuditCard key={audit.id} audit={audit} />
          ))}
        </div>
      )}
    </section>
  );
}

function PlannerAuditCard({ audit }: { audit: AuditWithNCCount }) {
  const status = formatStatus(audit.status);
  const signals = getAuditRiskSignals(audit).slice(0, 2);

  return (
    <Link
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
          <Badge key={signal.key} variant="outline" className={cn("rounded-full", signal.tone)}>
            {signal.label}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
