import { createServerClient } from "@/lib/supabase/server";
import type { NCStatus, NCsSeverity } from "@/types/database.types";

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

export async function getNonConformitiesByAudit(
  auditId: string
): Promise<NonConformity[]> {
  const supabase = await createServerClient();

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
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching non-conformities:", error);
    return [];
  }

  return (data || []).map((nc: any) => ({
    id: nc.id,
    auditId: nc.audit_id,
    checklistItemId: nc.checklist_item_id,
    title: nc.title,
    description: nc.description,
    severity: nc.severity,
    status: nc.status,
    createdAt: nc.created_at,
    updatedAt: nc.updated_at,
    closedAt: nc.closed_at,
    checklistItem: nc.checklist_items
      ? {
          question: nc.checklist_items.question,
          outcome: nc.checklist_items.outcome,
        }
      : undefined,
  }));
}

export async function getNonConformity(
  ncId: string
): Promise<NonConformity | null> {
  const supabase = await createServerClient();

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
    .single();

  if (error) {
    console.error("Error fetching non-conformity:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    auditId: data.audit_id,
    checklistItemId: data.checklist_item_id,
    title: data.title,
    description: data.description,
    severity: data.severity,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    closedAt: data.closed_at,
    checklistItem: data.checklist_items
      ? {
          question: data.checklist_items.question,
          outcome: data.checklist_items.outcome,
        }
      : undefined,
  };
}
