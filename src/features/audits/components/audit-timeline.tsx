"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  TrendingUp,
} from "lucide-react";
import type { AuditTimelineEvent } from "@/features/audits/queries/get-audit-timeline";

interface AuditTimelineProps {
  events: AuditTimelineEvent[];
  emptyMessage?: string;
}

export function AuditTimeline({
  events,
  emptyMessage = "No audit history available",
}: AuditTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Closed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "In Progress":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "Review":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "Closed":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      case "Review":
        return "bg-orange-100 text-orange-800";
      case "Scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-500";
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const groupedByYear = useMemo(() => {
    const groups: Record<string, AuditTimelineEvent[]> = {};

    events.forEach((event) => {
      const date = event.scheduled_date
        ? new Date(event.scheduled_date)
        : new Date(event.completed_date || 0);
      const year = date.getFullYear().toString();

      if (!groups[year]) {
        groups[year] = [];
      }
      groups[year].push(event);
    });

    return Object.entries(groups)
      .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
      .reduce(
        (acc, [year, items]) => {
          acc[year] = items;
          return acc;
        },
        {} as Record<string, AuditTimelineEvent[]>
      );
  }, [events]);

  if (events.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-500">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {Object.entries(groupedByYear).map(([year, yearEvents]) => (
        <div key={year}>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{year}</h3>

          <div className="space-y-4">
            {yearEvents.map((event, idx) => (
              <Link key={event.id} href={`/audits/${event.audit_id}`}>
                <div className="group relative flex gap-4 rounded-lg border border-slate-200 p-4 hover:border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer">
                  {/* Timeline marker */}
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-slate-300 group-hover:border-emerald-500">
                      {getStatusIcon(event.status)}
                    </div>
                    {idx < yearEvents.length - 1 && (
                      <div className="mt-2 w-0.5 h-12 bg-slate-200"></div>
                    )}
                  </div>

                  {/* Event content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 group-hover:text-emerald-700">
                          {event.audit_title || "Audit senza titolo"}
                        </h4>
                        {event.location_name && (
                          <p className="text-sm text-slate-600">
                            📍 {event.location_name}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusBadgeColor(event.status)}>
                        {event.status}
                      </Badge>
                    </div>

                    {/* Date and metrics */}
                    <div className="flex flex-wrap gap-3 text-sm text-slate-600 mb-3">
                      {event.scheduled_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(event.scheduled_date).toLocaleDateString(
                            "it-IT"
                          )}
                        </span>
                      )}
                      {event.score !== null && (
                        <span className={`flex items-center gap-1 font-semibold ${getScoreColor(event.score)}`}>
                          <TrendingUp className="h-3.5 w-3.5" />
                          {Math.round(event.score)}%
                        </span>
                      )}
                    </div>

                    {/* Progress indicators */}
                    <div className="flex flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all"
                            style={{
                              width: `${event.checklist_completion_percentage}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-slate-600 whitespace-nowrap">
                          {event.checklist_completion_percentage}% checklist
                        </span>
                      </div>

                      {event.nc_count > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          <AlertCircle className="h-3 w-3" />
                          {event.nc_count} NC{event.ac_closed_count > 0 && ` · ${event.ac_closed_count} closed`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
