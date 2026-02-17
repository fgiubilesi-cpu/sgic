import { AuditStatusBadge } from "@/features/audits/components/audit-status-badge";
import { notFound } from "next/navigation";
import { getAudit } from "@/features/audits/queries/get-audit";
import { ChecklistManager } from "@/features/audits/components/checklist-manager";
import { AuditStats } from "@/features/audits/components/audit-stats"; // <--- 1. IMPORTA QUESTO

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

  // Formattiamo la data
  const formattedDate = audit.scheduled_date 
    ? new Date(audit.scheduled_date).toLocaleDateString("it-IT") 
    : "Data non definita";

  return (
    <div className="flex flex-col space-y-6">
      {/* Header Semplice */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{audit.title}</h1>
        <div className="flex items-center gap-2 text-muted-foreground mt-1">
        <AuditStatusBadge 
     auditId={audit.id} 
     currentStatus={audit.status || "planned"} 
/>
           <span className="text-sm">Programmato per: {formattedDate}</span>
        </div>
      </div>

      {/* 2. INSERISCI LE STATISTICHE QUI */}
      <AuditStats audit={audit} />

      {/* Checklist */}
      <ChecklistManager audit={audit} />
    </div>
  );
}