import { createClient } from "@/lib/supabase/server";
import type { Audit } from "@/features/audits/queries/get-audits";
import type { AuditStatus } from "@/features/audits/schemas/audit-schema";
import type { AuditOutcome } from "@/types/database.types";

export type ChecklistItem = {
  id: string;
  question: string;  // Always required - comes from template or manual entry
  outcome: AuditOutcome | null;
  notes?: string | null;
  evidence_url?: string | null;
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
};

export async function getAudit(id: string): Promise<AuditWithChecklists | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return null;
  }

  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select(
      "id, title, status, scheduled_date, organization_id, checklists(id, title, created_at, checklist_items(id, question, outcome, notes, evidence_url, created_at))"
    )
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .single();

  if (auditError || !audit) {
    return null;
  }

  const rawStatus = (audit as { status?: string | null }).status ?? "Scheduled";
  const allowedStatuses: AuditStatus[] = ["Scheduled", "In Progress", "Review", "Closed"];
  const status: AuditStatus = allowedStatuses.includes(rawStatus as AuditStatus)
    ? (rawStatus as AuditStatus)
    : "Scheduled";

  const rawChecklists =
    (audit as { checklists?: unknown[] | null }).checklists ?? [];

  const checklists: Checklist[] = rawChecklists.map((rawChecklist) => {
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
        created_at?: string | null;
      };

      const validOutcomes: AuditOutcome[] = ["compliant", "non_compliant", "not_applicable", "pending"];
      const rawOutcome = item.outcome ?? "pending";
      const outcome: AuditOutcome = validOutcomes.includes(rawOutcome as AuditOutcome)
        ? (rawOutcome as AuditOutcome)
        : "pending";

      return {
        id: String(item.id),
        question: item.question ?? "Untitled Question",  // Always required
        outcome,
        notes: item.notes ?? null,
        evidence_url: item.evidence_url ?? null,
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

  return {
    id: String(audit.id),
    title: (audit as { title?: string | null }).title ?? null,
    status,
    scheduled_date: (audit as { scheduled_date?: string | null }).scheduled_date ?? null,
    checklists,
  };
}
