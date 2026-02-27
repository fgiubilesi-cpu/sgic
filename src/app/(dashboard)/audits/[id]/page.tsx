import { notFound } from "next/navigation";
import { getAudit } from "@/features/audits/queries/get-audit";
import { AuditStatusBadge } from "@/features/audits/components/audit-status-badge";
import { ChecklistManager } from "@/features/audits/components/checklist-manager";
import { AuditStats } from "@/features/audits/components/audit-stats";

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
    </div>
  );
}
