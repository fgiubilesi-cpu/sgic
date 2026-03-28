import { createClient } from "@/lib/supabase/server";
import type { NCStatus, NCsSeverity } from "@/features/quality/schemas/nc-ac.schema";
import { toCanonicalNonConformity } from "@/features/quality/lib/nc-ac-contract";

export interface NonConformity {
  id: string;
  auditId: string;
  checklistItemId: string;
  title: string;
  description: string | null;
  severity: NCsSeverity;
  status: NCStatus;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  checklistItem?: {
    question: string;
    outcome: string;
  };
}

type NonConformityRow = {
  audit_id: string;
  checklist_item_id: string;
  checklist_items:
    | {
        outcome: string;
        question: string;
      }
    | Array<{
        outcome: string;
        question: string;
      }>
    | null;
  closed_at: string | null;
  created_at: string;
  description: string | null;
  id: string;
  severity: NCsSeverity;
  status: NCStatus;
  title: string;
  updated_at: string;
};

export async function getNonConformitiesByAudit(
  auditId: string
): Promise<NonConformity[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("non_conformities")
    .select(
      `
      id,
      audit_id,
      checklist_item_id,
      title,
      description,
      severity,
      status,
      created_at,
      updated_at,
      closed_at,
      checklist_items:checklist_item_id (
        question,
        outcome
      )
    `
    )
    .eq("audit_id", auditId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching non-conformities:", error);
    return [];
  }

  return ((data ?? []) as NonConformityRow[]).map((nc) => {
    const canonical = toCanonicalNonConformity(nc);
    return {
      id: canonical.id,
      auditId: canonical.auditId ?? "",
      checklistItemId: canonical.checklistItemId ?? "",
      title: canonical.title ?? "",
      description: canonical.description,
      severity: canonical.severity,
      status: canonical.status,
      createdAt: canonical.createdAt ?? "",
      updatedAt: canonical.updatedAt ?? "",
      closedAt: canonical.closedAt,
      checklistItem: canonical.checklistQuestion
        ? {
            question: canonical.checklistQuestion,
            outcome: canonical.checklistOutcome ?? "",
          }
        : undefined,
    };
  });
}

export async function getNonConformity(
  ncId: string
): Promise<NonConformity | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("non_conformities")
    .select(
      `
      id,
      audit_id,
      checklist_item_id,
      title,
      description,
      severity,
      status,
      created_at,
      updated_at,
      closed_at,
      checklist_items:checklist_item_id (
        question,
        outcome
      )
    `
    )
    .eq("id", ncId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error fetching non-conformity:", error);
    return null;
  }

  if (!data) return null;

  // Supabase types the FK join as an array; normalise to a single item.
  const rawItem = Array.isArray(data.checklist_items)
    ? data.checklist_items[0]
    : data.checklist_items;

  const canonical = toCanonicalNonConformity({
    ...data,
    checklist_items: rawItem,
  });

  return {
    id: canonical.id,
    auditId: canonical.auditId ?? "",
    checklistItemId: canonical.checklistItemId ?? "",
    title: canonical.title ?? "",
    description: canonical.description,
    severity: canonical.severity,
    status: canonical.status,
    createdAt: canonical.createdAt ?? "",
    updatedAt: canonical.updatedAt ?? "",
    closedAt: canonical.closedAt,
    checklistItem: canonical.checklistQuestion
      ? {
          question: canonical.checklistQuestion,
          outcome: canonical.checklistOutcome ?? "",
        }
      : undefined,
  };
}
