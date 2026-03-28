import { getClientAudits } from "@/features/audits/queries/get-client-audits";
import { buildClientAuditInsights } from "@/features/clients/lib/client-audit-insights";
import {
  buildClientRiskRadar,
  type ClientRiskRadar,
} from "@/features/clients/lib/client-risk-radar";
import { getDailyExecutionOverview } from "@/features/clients/queries/get-daily-execution-overview";
import { getUnifiedDeadlines } from "@/features/deadlines/queries/get-unified-deadlines";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export interface ClientRiskRadarData {
  averageAuditScore: number | null;
  radar: ClientRiskRadar;
  scoreDelta: number | null;
  upcomingAuditCount: number;
}

export async function getClientRiskRadar(): Promise<ClientRiskRadarData | null> {
  const ctx = await getOrganizationContext();
  if (!ctx || ctx.role !== "client" || !ctx.clientId) {
    return null;
  }

  const [audits, executionOverview, deadlines, reviewDocumentsResult] = await Promise.all([
    getClientAudits(),
    getDailyExecutionOverview(ctx.organizationId, { clientId: ctx.clientId }),
    getUnifiedDeadlines({ clientId: ctx.clientId }),
    ctx.supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .eq("client_id", ctx.clientId)
      .in("ingestion_status", ["review_required", "failed"]),
  ]);

  if (reviewDocumentsResult.error) {
    throw reviewDocumentsResult.error;
  }

  const auditIds = audits.map((audit) => audit.id);
  let openNcCount = 0;
  let criticalNcCount = 0;

  if (auditIds.length > 0) {
    const { data: nonConformities, error } = await ctx.supabase
      .from("non_conformities")
      .select("severity, status")
      .in("audit_id", auditIds)
      .is("deleted_at", null)
      .neq("status", "closed");

    if (error) throw error;

    openNcCount = (nonConformities ?? []).length;
    criticalNcCount = (nonConformities ?? []).filter(
      (nc) => nc.severity === "critical"
    ).length;
  }

  const auditInsights = buildClientAuditInsights(
    audits.map((audit) => ({
      id: audit.id,
      location_name: audit.location_name,
      nc_count: 0,
      scheduled_date: audit.scheduled_date,
      score: audit.score,
      status: audit.status,
      title: audit.title,
    })),
    []
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingAuditCount = audits.filter(
    (audit) =>
      audit.status !== "Closed" &&
      audit.scheduled_date !== null &&
      new Date(audit.scheduled_date) >= today
  ).length;

  const radar = buildClientRiskRadar({
    averageAuditScore: auditInsights.averageScore,
    criticalNcCount,
    expiringDocumentCount: deadlines.filter(
      (deadline) =>
        deadline.type === "document" && deadline.urgency !== "overdue"
    ).length,
    openNcCount,
    overdueActionCount: deadlines.filter(
      (deadline) =>
        deadline.type === "corrective_action" && deadline.urgency === "overdue"
    ).length,
    overdueDocumentCount: deadlines.filter(
      (deadline) => deadline.type === "document" && deadline.urgency === "overdue"
    ).length,
    overdueTaskCount: executionOverview.overdueItems.filter(
      (item) => item.kind === "task"
    ).length,
    overdueTrainingCount: deadlines.filter(
      (deadline) =>
        (deadline.type === "training" || deadline.type === "medical") &&
        deadline.urgency === "overdue"
    ).length,
    reviewQueueCount: reviewDocumentsResult.count ?? 0,
    scoreDelta: auditInsights.scoreDelta,
    upcomingAuditCount,
  });

  return {
    averageAuditScore: auditInsights.averageScore,
    radar,
    scoreDelta: auditInsights.scoreDelta,
    upcomingAuditCount,
  };
}
