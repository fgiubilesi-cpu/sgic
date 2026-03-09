import { createClient } from "@/lib/supabase/server";
import type { CorrectiveActionStatus } from "@/features/quality/schemas/nc-ac.schema";

export interface CorrectiveAction {
  id: string;
  nonConformityId: string;
  description: string;
  rootCause: string | null;
  actionPlan: string | null;
  responsiblePersonName: string | null;
  responsiblePersonEmail: string | null;
  dueDate: string | null;
  targetCompletionDate: string | null;
  status: CorrectiveActionStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export async function getCorrectiveActionsByNonConformity(
  ncId: string
): Promise<CorrectiveAction[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("corrective_actions")
    .select("*")
    .eq("non_conformity_id", ncId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching corrective actions:", error);
    return [];
  }

  return (data || []).map((ca: any) => ({
    id: ca.id,
    nonConformityId: ca.non_conformity_id,
    description: ca.description,
    rootCause: ca.root_cause,
    actionPlan: ca.action_plan,
    responsiblePersonName: ca.responsible_person_name,
    responsiblePersonEmail: ca.responsible_person_email,
    dueDate: ca.due_date,
    targetCompletionDate: ca.target_completion_date,
    status: ca.status,
    createdAt: ca.created_at,
    updatedAt: ca.updated_at,
    completedAt: ca.completed_at,
  }));
}

/**
 * Bulk-fetch all corrective actions for every NC in an audit.
 * Avoids N+1: one query per audit instead of one per NC.
 */
export async function getCorrectiveActionsByAudit(
  auditId: string
): Promise<CorrectiveAction[]> {
  const supabase = await createClient();

  // First get all NC ids for this audit
  const { data: ncs, error: ncError } = await supabase
    .from("non_conformities")
    .select("id")
    .eq("audit_id", auditId);

  if (ncError || !ncs || ncs.length === 0) return [];

  const ncIds = ncs.map((nc: any) => nc.id as string);

  const { data, error } = await supabase
    .from("corrective_actions")
    .select("*")
    .in("non_conformity_id", ncIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching corrective actions by audit:", error);
    return [];
  }

  return (data || []).map((ca: any) => ({
    id: ca.id,
    nonConformityId: ca.non_conformity_id,
    description: ca.description,
    rootCause: ca.root_cause,
    actionPlan: ca.action_plan,
    responsiblePersonName: ca.responsible_person_name,
    responsiblePersonEmail: ca.responsible_person_email,
    dueDate: ca.due_date,
    targetCompletionDate: ca.target_completion_date,
    status: ca.status,
    createdAt: ca.created_at,
    updatedAt: ca.updated_at,
    completedAt: ca.completed_at,
  }));
}

export async function getCorrectiveAction(
  caId: string
): Promise<CorrectiveAction | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("corrective_actions")
    .select("*")
    .eq("id", caId)
    .single();

  if (error) {
    console.error("Error fetching corrective action:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    nonConformityId: data.non_conformity_id,
    description: data.description,
    rootCause: data.root_cause,
    actionPlan: data.action_plan,
    responsiblePersonName: data.responsible_person_name,
    responsiblePersonEmail: data.responsible_person_email,
    dueDate: data.due_date,
    targetCompletionDate: data.target_completion_date,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    completedAt: data.completed_at,
  };
}
