import Link from "next/link";
import { getAuditTimeline } from "@/features/audits/queries/get-audit-timeline";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuditTimeline } from "@/features/audits/components/audit-timeline";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { buildAuditHistorySummary } from "@/features/audits/lib/audit-history-view";

export const dynamic = "force-dynamic";

export default async function AuditHistoryPage() {
  const [ctx, timelineData] = await Promise.all([
    getOrganizationContext(),
    getAuditTimeline(),
  ]);

  let clientName = "";

  if (ctx?.supabase && ctx.clientId) {
    const { data: client } = await ctx.supabase
      .from("clients")
      .select("name")
      .eq("id", ctx.clientId)
      .is("deleted_at", null)
      .single();

    if (client?.name) {
      clientName = client.name;
    }
  }

  const summary = buildAuditHistorySummary(timelineData);

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Total Audits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.totalAudits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              Closed Audits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{summary.closedAudits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{summary.inProgressAudits}</div>
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
              {summary.averageCompliance}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>
            Click any audit to view details or download the report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditTimeline
            events={timelineData}
            emptyMessage="No audit history available"
          />
        </CardContent>
      </Card>
    </div>
  );
}
