"use client";

import Link from "next/link";
import { Stethoscope, AlertCircle, CheckCircle } from "lucide-react";
import type { MedicalVisitDeadline } from "@/features/dashboard/queries/get-dashboard-data";

interface MedicalVisitsWidgetProps {
  visits: MedicalVisitDeadline[];
}

export function MedicalVisitsWidget({ visits }: MedicalVisitsWidgetProps) {
  if (visits.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-sm text-green-900">
            Nessuna visita in scadenza
          </h3>
          <p className="text-xs text-green-700 mt-0.5">
            Tutte le visite mediche sono valide per i prossimi 90 giorni.
          </p>
        </div>
      </div>
    );
  }

  const overdueCount = visits.filter((v) => v.urgency === "overdue").length;
  const warningCount = visits.filter((v) => v.urgency === "warning").length;

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
                ? `${overdueCount} visita${overdueCount > 1 ? "e" : ""} scaduta${overdueCount > 1 ? "" : ""}`
                : `${warningCount} visita${warningCount > 1 ? "e" : ""} in scadenza entro 30 giorni`}
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                overdueCount > 0 ? "text-red-700" : "text-amber-700"
              }`}
            >
              {overdueCount > 0
                ? "Pianificare la visita di rinnovo con urgenza."
                : "Contattare il medico competente per la pianificazione."}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {visits.map((visit) => (
          <Link
            key={visit.id}
            href={`/personnel/${visit.personnelId}`}
            className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
              visit.urgency === "overdue"
                ? "border-red-200 bg-red-50 hover:border-red-300"
                : visit.urgency === "warning"
                  ? "border-amber-200 bg-amber-50 hover:border-amber-300"
                  : "border-green-200 bg-green-50 hover:border-green-300"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm truncate ${
                  visit.urgency === "overdue"
                    ? "text-red-900"
                    : visit.urgency === "warning"
                      ? "text-amber-900"
                      : "text-green-900"
                }`}
              >
                {visit.personnelName}
              </p>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {visit.clientName}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p
                className={`text-xs font-semibold ${
                  visit.urgency === "overdue"
                    ? "text-red-700"
                    : visit.urgency === "warning"
                      ? "text-amber-700"
                      : "text-green-700"
                }`}
              >
                {visit.expiryDate}
              </p>
              <p
                className={`text-[10px] ${
                  visit.urgency === "overdue"
                    ? "text-red-600"
                    : visit.urgency === "warning"
                      ? "text-amber-600"
                      : "text-green-600"
                }`}
              >
                {visit.urgency === "overdue"
                  ? `Scaduta da ${Math.abs(visit.daysUntil)}gg`
                  : `In ${visit.daysUntil}gg`}
              </p>
            </div>
            <Stethoscope
              className={`w-4 h-4 flex-shrink-0 ${
                visit.urgency === "overdue"
                  ? "text-red-400"
                  : visit.urgency === "warning"
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
