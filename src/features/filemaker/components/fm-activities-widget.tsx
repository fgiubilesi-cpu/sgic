import { Database, AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { GetFMActivitiesResult } from "@/features/filemaker/queries/get-fm-activities";

interface FMActivitiesWidgetProps {
  result: GetFMActivitiesResult;
}

export function FMActivitiesWidget({ result }: FMActivitiesWidgetProps) {
  // FM not configured — show nothing to non-admin
  if (!result.available && !result.error) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-700">
            Attività G&A (FileMaker)
          </h2>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
            live
          </span>
        </div>
        <Link
          href="/admin/fm-sync"
          className="text-xs text-zinc-400 hover:text-zinc-600 flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          Sincronizza FM
        </Link>
      </div>

      {result.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">{result.error}</p>
        </div>
      ) : result.activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm text-zinc-400">
            Nessuna attività G&A trovata per questo cliente in FileMaker.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
          <div className="divide-y divide-zinc-100">
            {result.activities.map((activity) => (
              <div
                key={activity.recordId}
                className="flex items-center gap-4 px-5 py-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {activity.type}
                  </p>
                  {activity.notes && (
                    <p className="text-xs text-zinc-400 truncate mt-0.5">
                      {activity.notes}
                    </p>
                  )}
                </div>
                <span className="text-xs text-zinc-500 whitespace-nowrap">
                  {activity.date}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${
                    activity.status.toLowerCase().includes("complet") ||
                    activity.status.toLowerCase().includes("chiuso")
                      ? "border-green-200 bg-green-50 text-green-700"
                      : activity.status.toLowerCase().includes("aperto") ||
                          activity.status.toLowerCase().includes("corso")
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-zinc-200 bg-zinc-50 text-zinc-500"
                  }`}
                >
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
