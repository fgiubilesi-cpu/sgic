import { getAudits } from "@/features/audits/queries/get-audits";
import { AuditTable } from "@/features/audits/components/audit-table";
import { CreateAuditSheet } from "@/features/audits/components/create-audit-sheet";

export default async function AuditsPage() {
  const audits = await getAudits();

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Audit Programmati
          </h1>
          <p className="text-sm text-zinc-500">
            Visualizza e gestisci gli audit pianificati per la tua organizzazione.
          </p>
        </div>
        <CreateAuditSheet />
      </div>

      <AuditTable audits={audits} />
    </section>
  );
}

