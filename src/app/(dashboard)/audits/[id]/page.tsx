import { notFound } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAudit } from "@/features/audits/queries/get-audit";
import { getNonConformitiesByAudit } from "@/features/audits/queries/get-non-conformities";
import { getCorrectiveActionsByAudit } from "@/features/audits/queries/get-corrective-actions";
import { getAuditSummary } from "@/features/audits/queries/get-audit-summary";
import { getAllTemplates } from "@/features/audits/queries/get-templates";
import { canManageTemplates } from "@/lib/user-roles";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { AuditStatusBadge } from "@/features/audits/components/audit-status-badge";
import { AuditChecklistWorkspace } from "@/features/audits/components/audit-checklist-workspace";
import { AuditStats } from "@/features/audits/components/audit-stats";
import { NcAcTab } from "@/features/audits/components/nc-ac-tab";
import { TemplateTab } from "@/features/audits/components/template-tab";
import { AuditCompletionSection } from "@/features/audits/components/audit-completion-section";
import { ExportExcelButton } from "@/features/audits/components/export-excel-button";
import { EmailDraftModal } from "@/features/audits/components/email-draft-modal";
import { SendAuditReportButton } from "@/features/email/components/send-audit-report-button";

export const dynamic = "force-dynamic";

interface TabConfig {
  id: "checklist" | "nc" | "templates";
  label: string;
  requiresInspector?: boolean;
}

const ALL_TABS: TabConfig[] = [
  { id: "checklist", label: "Checklist" },
  { id: "nc", label: "Non Conformità / AC" },
  { id: "templates", label: "Template", requiresInspector: true },
];

type TabId = TabConfig["id"];

export default async function AuditDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: rawTab } = await searchParams;

  const audit = await getAudit(id);

  if (!audit) {
    notFound();
  }

  // Check if current user is an inspector and get role
  const userCanManageTemplates = await canManageTemplates();
  const ctx = await getOrganizationContext();
  const isReadOnly = ctx?.role === "client";

  // Filter tabs based on user role
  const TABS: TabConfig[] = ALL_TABS.filter(
    (tab) => !tab.requiresInspector || userCanManageTemplates
  );

  // Validate the active tab
  const validTabIds = TABS.map((t) => t.id);
  const activeTab: TabId =
    (rawTab && validTabIds.includes(rawTab as TabId)
      ? (rawTab as TabId)
      : "checklist") || "checklist";

  const [nonConformities, correctiveActions, summary, templates] = await Promise.all([
    getNonConformitiesByAudit(id),
    getCorrectiveActionsByAudit(id),
    getAuditSummary(id),
    getAllTemplates(),
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
      {/* Read-only banner for clients */}
      {isReadOnly && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          📋 Modalità sola lettura — Puoi visualizzare i dati ma non modificarli.
        </div>
      )}

      {/* Breadcrumb locale */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-4">
        <span>Audit</span>
        {audit.client_name && (
          <>
            <span>/</span>
            <span className="text-zinc-600">{audit.client_name}</span>
          </>
        )}
        {audit.location_name && (
          <>
            <span>/</span>
            <span className="text-zinc-600">{audit.location_name}</span>
          </>
        )}
        <span>/</span>
        <span className="text-zinc-900 font-medium">{audit.title}</span>
      </div>

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
          <div className="flex items-center gap-2">
            {userCanManageTemplates && !isReadOnly && (
              <EmailDraftModal
                auditId={audit.id}
                hasNonConformities={nonConformities.length > 0}
              />
            )}
            {!isReadOnly && <ExportExcelButton auditId={audit.id} auditTitle={audit.title} />}
            {!isReadOnly && <SendAuditReportButton auditId={audit.id} />}
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
          <AuditChecklistWorkspace
            audit={audit}
            nonConformities={nonConformities}
            readOnly={isReadOnly}
          />
          {!isReadOnly && <AuditCompletionSection audit={audit} summary={summary} />}
        </>
      )}

      {activeTab === "nc" && (
        <NcAcTab
          audit={audit}
          nonConformities={nonConformities}
          correctiveActions={correctiveActions}
          readOnly={isReadOnly}
        />
      )}

      {activeTab === "templates" && userCanManageTemplates && (
        <TemplateTab audit={audit} templates={templates} readOnly={isReadOnly} />
      )}
    </div>
  );
}
