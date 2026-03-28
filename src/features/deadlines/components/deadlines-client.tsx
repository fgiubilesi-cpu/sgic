"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  GraduationCap,
  ClipboardCheck,
  FileText,
  AlertCircle,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import type { UnifiedDeadline, DeadlineType, DeadlineUrgency } from "@/features/deadlines/queries/get-unified-deadlines";

const TYPE_LABELS: Record<DeadlineType, string> = {
  medical: "Visite mediche",
  training: "Attestati",
  audit: "Audit",
  document: "Documenti",
  corrective_action: "Azioni correttive",
};

const TYPE_ICONS: Record<DeadlineType, React.ElementType> = {
  medical: Activity,
  training: GraduationCap,
  audit: ClipboardCheck,
  document: FileText,
  corrective_action: AlertCircle,
};

const URGENCY_LABELS: Record<DeadlineUrgency, string> = {
  overdue: "Scadute",
  warning30: "Entro 30gg",
  warning90: "Entro 90gg",
  ok: "In regola",
};

const URGENCY_COLORS: Record<DeadlineUrgency, { bg: string; text: string; border: string; dot: string }> = {
  overdue: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  warning30: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  warning90: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
    dot: "bg-yellow-400",
  },
  ok: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    dot: "bg-green-500",
  },
};

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

function DaysLabel({ daysUntil }: { daysUntil: number }) {
  if (daysUntil < 0) {
    return (
      <span className="text-[11px] font-semibold text-red-600">
        Scaduta da {Math.abs(daysUntil)}gg
      </span>
    );
  }
  if (daysUntil === 0) {
    return <span className="text-[11px] font-semibold text-red-600">Oggi</span>;
  }
  return (
    <span className="text-[11px] font-medium text-zinc-500">In {daysUntil}gg</span>
  );
}

interface DeadlinesClientProps {
  deadlines: UnifiedDeadline[];
}

export function DeadlinesClient({ deadlines }: DeadlinesClientProps) {
  const [activeType, setActiveType] = useState<DeadlineType | "all">("all");
  const [activeUrgency, setActiveUrgency] = useState<DeadlineUrgency | "all">("all");

  const counts = useMemo(() => {
    const byUrgency: Record<DeadlineUrgency, number> = {
      overdue: 0,
      warning30: 0,
      warning90: 0,
      ok: 0,
    };
    for (const d of deadlines) {
      byUrgency[d.urgency]++;
    }
    return byUrgency;
  }, [deadlines]);

  const filtered = useMemo(() => {
    return deadlines.filter((d) => {
      if (activeType !== "all" && d.type !== activeType) return false;
      if (activeUrgency !== "all" && d.urgency !== activeUrgency) return false;
      return true;
    });
  }, [deadlines, activeType, activeUrgency]);

  const allTypes = (["medical", "training", "audit", "document", "corrective_action"] as DeadlineType[]).filter(
    (t) => deadlines.some((d) => d.type === t)
  );

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["overdue", "warning30", "warning90", "ok"] as DeadlineUrgency[]).map((u) => {
          const c = URGENCY_COLORS[u];
          const isActive = activeUrgency === u;
          return (
            <button
              key={u}
              onClick={() => setActiveUrgency(isActive ? "all" : u)}
              className={`rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? `${c.bg} ${c.border} ring-2 ring-offset-1 ${
                      u === "overdue"
                        ? "ring-red-400"
                        : u === "warning30"
                          ? "ring-amber-400"
                          : u === "warning90"
                            ? "ring-yellow-400"
                            : "ring-green-400"
                    }`
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                <span className="text-xs font-medium text-zinc-500">
                  {URGENCY_LABELS[u]}
                </span>
              </div>
              <p className={`text-2xl font-bold ${isActive ? c.text : "text-zinc-900"}`}>
                {counts[u]}
              </p>
            </button>
          );
        })}
      </div>

      {/* Filtri tipo */}
      {allTypes.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveType("all")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              activeType === "all"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
            }`}
          >
            Tutti ({deadlines.length})
          </button>
          {allTypes.map((t) => {
            const Icon = TYPE_ICONS[t];
            const count = deadlines.filter((d) => d.type === t).length;
            return (
              <button
                key={t}
                onClick={() => setActiveType(activeType === t ? "all" : t)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  activeType === t
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
              >
                <Icon className="h-3 w-3" />
                {TYPE_LABELS[t]} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Tabella */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <CheckCircle className="mx-auto h-8 w-8 text-green-400 mb-3" />
          <p className="text-sm font-medium text-zinc-700">
            {activeType === "all" && activeUrgency === "all"
              ? "Nessuna scadenza nei prossimi 90 giorni"
              : "Nessun risultato per i filtri selezionati"}
          </p>
          {(activeType !== "all" || activeUrgency !== "all") && (
            <button
              onClick={() => { setActiveType("all"); setActiveUrgency("all"); }}
              className="mt-3 text-xs text-zinc-400 hover:text-zinc-600 underline"
            >
              Rimuovi filtri
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="divide-y divide-zinc-100">
            {filtered.map((d) => {
              const c = URGENCY_COLORS[d.urgency];
              const Icon = TYPE_ICONS[d.type];
              return (
                <Link
                  key={d.id}
                  href={d.href}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-zinc-50 transition-colors group"
                >
                  {/* Semaforo */}
                  <span
                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${c.dot}`}
                  />

                  {/* Icona tipo */}
                  <span
                    className={`flex-shrink-0 rounded-lg p-1.5 ${c.bg}`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${c.text}`} />
                  </span>

                  {/* Contenuto */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">
                      {d.title}
                    </p>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {d.description}
                      {d.clientName && d.clientName !== "—"
                        ? ` · ${d.clientName}`
                        : ""}
                    </p>
                  </div>

                  {/* Badge tipo */}
                  <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 whitespace-nowrap">
                    {TYPE_LABELS[d.type]}
                  </span>

                  {/* Data */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium text-zinc-700">
                      {formatDate(d.dueDate)}
                    </p>
                    <DaysLabel daysUntil={d.daysUntil} />
                  </div>

                  <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-300 group-hover:text-zinc-400" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
