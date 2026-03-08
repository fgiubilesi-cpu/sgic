import { notFound } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAudit } from "@/features/audits/queries/get-audit";
import { getNonConformitiesByAudit } from "@/features/audits/queries/get-non-conformities";
import { getCorrectiveActionsByAudit } from "@/features/audits/queries/get-corrective-actions";
import { getAuditSummary } from "@/features/audits/queries/get-audit-summary";
import { AuditStatusBadge } from "@/features/audits/components/audit-status-badge";
import { ChecklistManager } from "@/features/audits/components/checklist-manager";
import { AuditStats } from "@/features/audits/components/audit-stats";
import { NcAcTab } from "@/features/audits/components/nc-ac-tab";
import { TemplateTab } from "@/features/audits/components/template-tab";
import { AuditCompletionSection } from "@/features/audits/components/audit-completion-section";

const TABS = [
  { id: "checklist", label: "Checklist" },
  { id: "nc", label: "Non Conformità / AC" },
  { id: "templates", label: "Template" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default async function AuditDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;

  const activeTab: TabId =
    rawTab === "nc" || rawTab === "templates" ? rawTab : "checklist";

  const audit = await getAudit(id);

  if (!audit) {
    notFound();
  }

  const [nonConformities, correctiveActions, summary] = await Promise.all([
    getNonConformitiesByAudit(id),
    getCorrectiveActionsByAudit(id),
    getAuditSummary(id),
  ]);

  const formattedDate = audit.scheduled_date
    ? new Intl.DateTimeFormat("it-IT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(new Date(audit.scheduled_date))
    : "Nessuna data";

  return (
    <div className="flex flex-col space-y-6">
      {/* Audit header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{audit.title}</h1>
            <div className="flex items-center gap-2 text-muted-foreground mt-1 flex-wrap">
              <AuditStatusBadge
                auditId={audit.id}
                currentStatus={audit.status ?? "planned"}
              />
              <span className="text-sm">{formattedDate}</span>
              {audit.client_name && (
                <span className="text-sm text-zinc-500">· {audit.client_name}</span>
              )}
              {audit.location_name && (
                <span className="text-sm text-zinc-500">· {audit.location_name}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuditStats audit={audit} />

      {/* Tab navigation */}
      <div className="border-b border-zinc-200">
        <nav className="flex gap-0 -mb-px" aria-label="Audit tabs">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={`/audits/${id}?tab=${tab.id}`}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
              )}
            >
              {tab.label}
              {tab.id === "nc" && nonConformities.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                  {nonConformities.length}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "checklist" && (
        <>
          <ChecklistManager audit={audit} nonConformities={nonConformities} />
          <AuditCompletionSection audit={audit} summary={summary} />
        </>
      )}

      {activeTab === "nc" && (
        <NcAcTab
          audit={audit}
          nonConformities={nonConformities}
          correctiveActions={correctiveActions}
        />
      )}

      {activeTab === "templates" && (
        <TemplateTab audit={audit} />
      )}
    </div>
  );
}
