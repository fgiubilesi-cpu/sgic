"use client";

import Link from "next/link";
import { ExternalLink, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecentAudit } from "@/features/dashboard/queries/get-dashboard-data";

interface RecentAuditsProps {
  audits: RecentAudit[];
}

export function RecentAudits({ audits }: RecentAuditsProps) {
  if (audits.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-400">
        Nessun audit nei tuoi registri.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {audits.map((audit) => (
        <Link
          key={audit.id}
          href={`/audits/${audit.id}`}
          className="flex items-center justify-between gap-3 p-3 rounded-lg border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-zinc-800 truncate group-hover:text-zinc-900">
              {audit.title}
            </p>
            <p className="text-xs text-zinc-400 truncate">
              {audit.clientName} · {audit.locationName}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {audit.score !== null && (
              <span
                className={`text-xs font-semibold px-2 py-1 rounded ${
                  audit.score >= 85
                    ? "bg-green-100 text-green-700"
                    : audit.score >= 70
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {audit.score.toFixed(1)}%
              </span>
            )}
            <ExternalLink className="w-4 h-4 text-zinc-300 group-hover:text-zinc-400" />
          </div>
        </Link>
      ))}
    </div>
  );
}
