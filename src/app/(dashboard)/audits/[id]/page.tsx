import { notFound } from "next/navigation";
import { getAudit } from "@/features/audits/queries/get-audit";
import { getNonConformitiesByAudit } from "@/features/audits/queries/get-non-conformities";
import { getCorrectiveActionsByAudit } from "@/features/audits/queries/get-corrective-actions";
import { getAuditSummary } from "@/features/audits/queries/get-audit-summary";
import { AuditStatusBadge } from "@/features/audits/components/audit-status-badge";
import { ChecklistManager } from "@/features/audits/components/checklist-manager";
import { AuditStats } from "@/features/audits/components/audit-stats";
import { NonConformitiesList } from "@/features/audits/components/non-conformities-list";
import { AuditCompletionSection } from "@/features/audits/components/audit-completion-section";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const audit = await getAudit(id);

  if (!audit) {
    notFound();
  }

  // Fetch NCs, their CAs, and the audit summary in parallel — no N+1, no client fetches.
  const [nonConformities, correctiveActionsByNC, auditSummary] = await Promise.all([
    getNonConformitiesByAudit(id),
    getCorrectiveActionsByAudit(id),
    getAuditSummary(id),
  ]);

  const formattedDate = audit.scheduled_date
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(audit.scheduled_date))
    : "No date set";

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{audit.title}</h1>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
          <AuditStatusBadge
            auditId={audit.id}
            currentStatus={audit.status ?? "planned"}
          />
          <span className="text-sm">Scheduled for: {formattedDate}</span>
        </div>
      </div>

      <AuditStats audit={audit} />

      <ChecklistManager audit={audit} />

      {/* correctiveActionsByNC is pre-fetched here and threaded down — no
          client-side fetch or useEffect required inside child components. */}
      <NonConformitiesList
        audit={audit}
        nonConformities={nonConformities}
        correctiveActionsByNC={correctiveActionsByNC}
      />

      {/* summary is pre-fetched server-side — no useEffect or client fetch needed. */}
      <AuditCompletionSection audit={audit} summary={auditSummary} />
    </div>
  );
}
