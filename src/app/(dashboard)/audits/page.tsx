import { getAudits } from "@/features/audits/queries/get-audits";
import { getAuditTemplates } from "@/features/audits/queries/get-templates";
import { AuditTable } from "@/features/audits/components/audit-table";
import { CreateAuditSheet } from "@/features/audits/components/create-audit-sheet";

export default async function AuditsPage() {
  // Both queries run in parallel — no serial waterfall.
  const [audits, templates] = await Promise.all([getAudits(), getAuditTemplates()]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Scheduled Audits
          </h1>
          <p className="text-sm text-zinc-500">
            View and manage all audits planned for your organisation.
          </p>
        </div>
        {/* Templates are pre-fetched server-side; CreateAuditSheet is pure UI. */}
        <CreateAuditSheet templates={templates} />
      </div>

      <AuditTable audits={audits} />
    </section>
  );
}
