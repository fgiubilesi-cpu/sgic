"use client";

import Link from "next/link";
import { GraduationCap, AlertCircle, CheckCircle } from "lucide-react";
import type { TrainingDeadline } from "@/features/dashboard/queries/get-dashboard-data";

interface TrainingDeadlinesWidgetProps {
  deadlines: TrainingDeadline[];
}

export function TrainingDeadlinesWidget({ deadlines }: TrainingDeadlinesWidgetProps) {
  if (deadlines.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-sm text-green-900">
            Nessun attestato in scadenza
          </h3>
          <p className="text-xs text-green-700 mt-0.5">
            Tutti gli attestati di formazione sono validi per i prossimi 90 giorni.
          </p>
        </div>
      </div>
    );
  }

  const overdueCount = deadlines.filter((d) => d.urgency === "overdue").length;
  const warningCount = deadlines.filter((d) => d.urgency === "warning").length;

  return (
    <div className="space-y-3">
      {/* Summary banner */}
      {(overdueCount > 0 || warningCount > 0) && (
        <div
          className={`rounded-xl border p-3 flex items-start gap-3 ${
            overdueCount > 0
              ? "border-red-200 bg-red-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <AlertCircle
            className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
              overdueCount > 0 ? "text-red-600" : "text-amber-600"
            }`}
          />
          <div>
            <h3
              className={`font-semibold text-sm ${
                overdueCount > 0 ? "text-red-900" : "text-amber-900"
              }`}
            >
              {overdueCount > 0
                ? `${overdueCount} attestato${overdueCount > 1 ? "i" : ""} scaduto${overdueCount > 1 ? "" : ""}`
                : `${warningCount} attestato${warningCount > 1 ? "i" : ""} in scadenza entro 30 giorni`}
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                overdueCount > 0 ? "text-red-700" : "text-amber-700"
              }`}
            >
              {overdueCount > 0
                ? "Pianificare il rinnovo della formazione con urgenza."
                : "Organizzare le sessioni formative entro il mese."}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {deadlines.map((d) => (
          <Link
            key={d.id}
            href={`/personnel/${d.personnelId}`}
            className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
              d.urgency === "overdue"
                ? "border-red-200 bg-red-50 hover:border-red-300"
                : d.urgency === "warning"
                  ? "border-amber-200 bg-amber-50 hover:border-amber-300"
                  : "border-green-200 bg-green-50 hover:border-green-300"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm truncate ${
                  d.urgency === "overdue"
                    ? "text-red-900"
                    : d.urgency === "warning"
                      ? "text-amber-900"
                      : "text-green-900"
                }`}
              >
                {d.personnelName}
              </p>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {d.courseTitle}
                {d.clientName ? ` · ${d.clientName}` : ""}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p
                className={`text-xs font-semibold ${
                  d.urgency === "overdue"
                    ? "text-red-700"
                    : d.urgency === "warning"
                      ? "text-amber-700"
                      : "text-green-700"
                }`}
              >
                {d.expiryDate}
              </p>
              <p
                className={`text-[10px] ${
                  d.urgency === "overdue"
                    ? "text-red-600"
                    : d.urgency === "warning"
                      ? "text-amber-600"
                      : "text-green-600"
                }`}
              >
                {d.urgency === "overdue"
                  ? `Scaduto da ${Math.abs(d.daysUntil)}gg`
                  : `In ${d.daysUntil}gg`}
              </p>
            </div>
            <GraduationCap
              className={`w-4 h-4 flex-shrink-0 ${
                d.urgency === "overdue"
                  ? "text-red-400"
                  : d.urgency === "warning"
                    ? "text-amber-400"
                    : "text-green-400"
              }`}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
