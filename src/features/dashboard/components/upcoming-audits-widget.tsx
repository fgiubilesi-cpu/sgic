"use client";

import Link from "next/link";
import { AlertCircle, Clock, Calendar } from "lucide-react";
import type { UpcomingAudit } from "@/features/dashboard/queries/get-dashboard-data";

interface UpcomingAuditsWidgetProps {
  audits: UpcomingAudit[];
}

export function UpcomingAuditsWidget({ audits }: UpcomingAuditsWidgetProps) {
  if (audits.length === 0) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
        <Clock className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-sm text-green-900">Nessun audit in scadenza</h3>
          <p className="text-xs text-green-700 mt-0.5">
            Complimenti! Non hai audit pianificati nei prossimi 7 giorni.
          </p>
        </div>
      </div>
    );
  }

  const overdueCount = audits.filter((a) => a.isOverdue).length;
  const urgentCount = audits.filter((a) => !a.isOverdue && a.daysUntil <= 2).length;

  return (
    <div className="space-y-3">
      {/* Alert banner */}
      {(overdueCount > 0 || urgentCount > 0) && (
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
                ? `${overdueCount} audit scaduto${overdueCount > 1 ? "i" : ""}`
                : `${urgentCount} audit${urgentCount > 1 ? "i" : ""} nei prossimi 2 giorni`}
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                overdueCount > 0 ? "text-red-700" : "text-amber-700"
              }`}
            >
              {overdueCount > 0
                ? "Priorità alta — contattare clienti immediatamente"
                : "Ricordare ai clienti le date di audit prossime"}
            </p>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {audits.map((audit) => (
          <Link
            key={audit.id}
            href={`/audits/${audit.id}`}
            className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
              audit.isOverdue
                ? "border-red-200 bg-red-50 hover:border-red-300"
                : audit.daysUntil <= 2
                  ? "border-amber-200 bg-amber-50 hover:border-amber-300"
                  : "border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p
                className={`font-medium text-sm truncate ${
                  audit.isOverdue
                    ? "text-red-900"
                    : audit.daysUntil <= 2
                      ? "text-amber-900"
                      : "text-zinc-800"
                }`}
              >
                {audit.title}
              </p>
              <p className="text-xs text-zinc-400 truncate mt-0.5">
                {audit.clientName} · {audit.locationName}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-right">
                <p
                  className={`text-xs font-semibold ${
                    audit.isOverdue
                      ? "text-red-700"
                      : audit.daysUntil <= 2
                        ? "text-amber-700"
                        : "text-zinc-600"
                  }`}
                >
                  {audit.scheduledDate}
                </p>
                <p
                  className={`text-[10px] ${
                    audit.isOverdue
                      ? "text-red-600"
                      : audit.daysUntil <= 2
                        ? "text-amber-600"
                        : "text-zinc-400"
                  }`}
                >
                  {audit.isOverdue ? "Scaduto" : `In ${audit.daysUntil}gg`}
                </p>
              </div>
              <Calendar className={`w-4 h-4 flex-shrink-0 ${
                audit.isOverdue
                  ? "text-red-400"
                  : audit.daysUntil <= 2
                    ? "text-amber-400"
                    : "text-zinc-300"
              }`} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
