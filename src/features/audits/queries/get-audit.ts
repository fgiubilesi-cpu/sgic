import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import type { Audit } from "@/features/audits/queries/get-audits";
import type { AuditStatus, AuditOutcome } from "@/features/audits/schemas/audit-schema";

export type ChecklistItem = {
  id: string;
  question: string;  // Always required - comes from template or manual entry
  outcome: AuditOutcome | null;
  notes?: string | null;
  evidence_url?: string | null;
  audio_url?: string | null;
  created_at: string | null;
};

export type Checklist = {
  id: string;
  title: string | null;
  created_at: string | null;
  items: ChecklistItem[];
};

export type AuditWithChecklists = Audit & {
  checklists: Checklist[];
  score?: number | null;
};

export async function getAudit(id: string): Promise<AuditWithChecklists | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const { supabase, organizationId } = ctx;

  // Step 1: Fetch audit with client and location joins only (no checklists)
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select(
      "id, title, status, scheduled_date, score, organization_id, client_id, location_id, client:client_id(name), location:location_id(name)"
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (auditError || !audit) {
    return null;
  }

  const rawStatus = (audit as { status?: string | null }).status ?? "Scheduled";
  const allowedStatuses: AuditStatus[] = ["Scheduled", "In Progress", "Review", "Closed"];
  const status: AuditStatus = allowedStatuses.includes(rawStatus as AuditStatus)
    ? (rawStatus as AuditStatus)
    : "Scheduled";

  // Step 2: Fetch checklists with checklist_items separately
  // If this query fails, return audit with empty checklists array instead of failing completely
  let checklists: Checklist[] = [];

  const { data: rawChecklists, error: checklistError } = await supabase
    .from("checklists")
    .select("id, title, created_at, checklist_items(id, question, outcome, notes, evidence_url, audio_url, created_at)")
    .eq("audit_id", id);

  if (!checklistError && rawChecklists) {
    checklists = rawChecklists.map((rawChecklist) => {
      const checklist = rawChecklist as {
        id?: string | number;
        title?: string | null;
        created_at?: string | null;
        checklist_items?: unknown[] | null;
      };

      const rawItems = checklist.checklist_items ?? [];
      const items: ChecklistItem[] = rawItems.map((rawItem) => {
        const item = rawItem as {
          id?: string | number;
          question?: string | null;
          outcome?: string | null;
          notes?: string | null;
          evidence_url?: string | null;
          audio_url?: string | null;
          created_at?: string | null;
        };

        const validOutcomes: AuditOutcome[] = ["compliant", "non_compliant", "not_applicable", "pending"];
        const rawOutcome = item.outcome ?? "pending";
        const outcome: AuditOutcome = validOutcomes.includes(rawOutcome as AuditOutcome)
          ? (rawOutcome as AuditOutcome)
          : "pending";

        return {
          id: String(item.id),
          question: item.question ?? "Untitled Question",
          outcome,
          notes: item.notes ?? null,
          evidence_url: item.evidence_url ?? null,
          audio_url: item.audio_url ?? null,
          created_at: item.created_at ?? null,
        };
      });

      return {
        id: String(checklist.id),
        title: checklist.title ?? null,
        created_at: checklist.created_at ?? null,
        items,
      };
    });
  }

  return {
    id: String(audit.id),
    title: (audit as { title?: string | null }).title ?? null,
    status,
    scheduled_date: (audit as { scheduled_date?: string | null }).scheduled_date ?? null,
    score: (audit as { score?: number | null }).score ?? null,
    client_id: (audit as { client_id?: string | null }).client_id ?? null,
    location_id: (audit as { location_id?: string | null }).location_id ?? null,
    client_name: (audit as { client?: { name?: string | null } | null }).client?.name ?? null,
    location_name: (audit as { location?: { name?: string | null } | null }).location?.name ?? null,
    checklists: checklists.length > 0 ? checklists : [],
  };
}
