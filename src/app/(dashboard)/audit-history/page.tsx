"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuditTimeline } from "@/features/audits/queries/get-audit-timeline";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditTimeline } from "@/features/audits/components/audit-timeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import type { AuditTimelineEvent } from "@/features/audits/queries/get-audit-timeline";

export default function AuditHistoryPage() {
  const [events, setEvents] = useState<AuditTimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientName, setClientName] = useState<string>("");
  const [totalAudits, setTotalAudits] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const ctx = await getOrganizationContext();

        // Get client name if available
        if (ctx?.supabase && ctx?.clientId) {
          const { data: client } = await ctx.supabase
            .from("clients")
            .select("name")
            .eq("id", ctx.clientId)
            .single();

          if (client?.name) {
            setClientName(client.name);
          }
        }

        const timelineData = await getAuditTimeline();
        setEvents(timelineData);
        setTotalAudits(timelineData.length);
      } catch (error) {
        console.error("Failed to fetch audit history:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/client-dashboard">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900">
            Audit History {clientName && `— ${clientName}`}
          </h1>
          <p className="text-slate-600 mt-2">
            Complete timeline of all audits and their results
          </p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Audits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAudits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Closed Audits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {events.filter((e) => e.status === "Closed").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {events.filter((e) => e.status === "In Progress").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Avg. Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">
              {events.length > 0
                ? Math.round(
                    events.reduce((sum, e) => sum + (e.score || 0), 0) /
                      events.filter((e) => e.score !== null).length
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>
            Click any audit to view details or download the report
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-32 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <AuditTimeline
              events={events}
              emptyMessage="No audit history available"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
