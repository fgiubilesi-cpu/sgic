import { createClient } from "@/lib/supabase/server";
import type { CorrectiveActionStatus } from "@/features/quality/schemas/nc-ac.schema";
import { toCanonicalCorrectiveAction } from "@/features/quality/lib/nc-ac-contract";

type CorrectiveActionRow = {
  action_plan: string | null;
  completed_at: string | null;
  created_at: string;
  description: string;
  due_date: string | null;
  id: string;
  non_conformity_id: string;
  responsible_person_email: string | null;
  responsible_person_name: string | null;
  root_cause: string | null;
  status: CorrectiveActionStatus;
  target_completion_date: string | null;
  updated_at: string;
};

type AuditNonConformityRow = {
  id: string;
};

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
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching corrective actions:", error);
    return [];
  }

  return ((data ?? []) as CorrectiveActionRow[]).map((ca) => {
    const canonical = toCanonicalCorrectiveAction(ca);
    return {
      id: canonical.id,
      nonConformityId: canonical.nonConformityId ?? "",
      description: canonical.description ?? "",
      rootCause: canonical.rootCause,
      actionPlan: canonical.actionPlan,
      responsiblePersonName: canonical.responsiblePersonName,
      responsiblePersonEmail: canonical.responsiblePersonEmail,
      dueDate: canonical.dueDate,
      targetCompletionDate: canonical.targetCompletionDate,
      status: canonical.status,
      createdAt: canonical.createdAt ?? "",
      updatedAt: canonical.updatedAt ?? "",
      completedAt: canonical.completedAt,
    };
  });
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
    .eq("audit_id", auditId)
    .is("deleted_at", null);

  if (ncError || !ncs || ncs.length === 0) return [];

  const ncIds = (ncs as AuditNonConformityRow[]).map((nonConformity) => nonConformity.id);

  const { data, error } = await supabase
    .from("corrective_actions")
    .select("*")
    .in("non_conformity_id", ncIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching corrective actions by audit:", error);
    return [];
  }

  return ((data ?? []) as CorrectiveActionRow[]).map((ca) => {
    const canonical = toCanonicalCorrectiveAction(ca);
    return {
      id: canonical.id,
      nonConformityId: canonical.nonConformityId ?? "",
      description: canonical.description ?? "",
      rootCause: canonical.rootCause,
      actionPlan: canonical.actionPlan,
      responsiblePersonName: canonical.responsiblePersonName,
      responsiblePersonEmail: canonical.responsiblePersonEmail,
      dueDate: canonical.dueDate,
      targetCompletionDate: canonical.targetCompletionDate,
      status: canonical.status,
      createdAt: canonical.createdAt ?? "",
      updatedAt: canonical.updatedAt ?? "",
      completedAt: canonical.completedAt,
    };
  });
}

export async function getCorrectiveAction(
  caId: string
): Promise<CorrectiveAction | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("corrective_actions")
    .select("*")
    .eq("id", caId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("Error fetching corrective action:", error);
    return null;
  }

  if (!data) return null;

  const canonical = toCanonicalCorrectiveAction(data);

  return {
    id: canonical.id,
    nonConformityId: canonical.nonConformityId ?? "",
    description: canonical.description ?? "",
    rootCause: canonical.rootCause,
    actionPlan: canonical.actionPlan,
    responsiblePersonName: canonical.responsiblePersonName,
    responsiblePersonEmail: canonical.responsiblePersonEmail,
    dueDate: canonical.dueDate,
    targetCompletionDate: canonical.targetCompletionDate,
    status: canonical.status,
    createdAt: canonical.createdAt ?? "",
    updatedAt: canonical.updatedAt ?? "",
    completedAt: canonical.completedAt,
  };
}
