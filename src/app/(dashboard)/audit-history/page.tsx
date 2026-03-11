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
      .single();

    if (client?.name) {
      clientName = client.name;
    }
  }

  const totalAudits = timelineData.length;
  const closedAudits = timelineData.filter((event) => event.status === "Closed").length;
  const inProgressAudits = timelineData.filter(
    (event) => event.status === "In Progress"
  ).length;
  const scoredEvents = timelineData.filter((event) => event.score !== null);
  const averageCompliance =
    scoredEvents.length > 0
      ? Math.round(
          scoredEvents.reduce((sum, event) => sum + (event.score || 0), 0) /
            scoredEvents.length
        )
      : 0;

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
            <div className="text-3xl font-bold text-green-600">{closedAudits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{inProgressAudits}</div>
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
              {averageCompliance}%
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
