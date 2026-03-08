import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { GlobalNC } from "@/features/dashboard/queries/get-dashboard-data";
import {
  NC_SEVERITY_LABELS,
  NC_SEVERITY_COLORS,
  NC_STATUS_LABELS,
  NC_STATUS_COLORS,
} from "@/features/quality/constants";

interface GlobalNCTableProps {
  nonConformities: GlobalNC[];
}

export function GlobalNCTable({ nonConformities }: GlobalNCTableProps) {
  if (nonConformities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-8 text-center text-sm text-zinc-500">
        Nessuna non conformità trovata per i filtri selezionati.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Non Conformità
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Audit
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Cliente / Sede
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Gravità
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Stato
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                Azione
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {nonConformities.map((nc) => {
              const severity = nc.severity as keyof typeof NC_SEVERITY_LABELS;
              const status = nc.status as keyof typeof NC_STATUS_LABELS;
              const dateStr = nc.auditDate
                ? new Intl.DateTimeFormat("it-IT").format(new Date(nc.auditDate))
                : "—";

              return (
                <tr key={nc.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 max-w-[220px]">
                    <p className="font-medium text-zinc-900 truncate">{nc.title}</p>
                    {nc.checklistItemQuestion && (
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {nc.checklistItemQuestion}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/audits/${nc.auditId}?tab=nc`}
                      className="text-zinc-700 hover:text-zinc-900 hover:underline truncate block max-w-[180px]"
                    >
                      {nc.auditTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-zinc-700 text-xs">{nc.clientName}</p>
                    <p className="text-zinc-400 text-xs">{nc.locationName}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                    {dateStr}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${NC_SEVERITY_COLORS[severity] ?? ""}`}>
                      {NC_SEVERITY_LABELS[severity] ?? nc.severity}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${NC_STATUS_COLORS[status] ?? ""}`}>
                      {NC_STATUS_LABELS[status] ?? nc.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/audits/${nc.auditId}?tab=nc`}
                      className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Vai
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50 text-xs text-zinc-400">
        {nonConformities.length} NC mostrate (max 100)
      </div>
    </div>
  );
}
