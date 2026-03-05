import { createClient } from "@/lib/supabase/server";
import type { CorrectiveActionStatus } from "@/types/database.types";

export interface CorrectiveAction {
  id: string;
  nonConformityId: string;
  description: string;
  rootCause: string | null;
  actionPlan: string | null;
  responsiblePersonName: string | null;
  responsiblePersonEmail: string | null;
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
    targetCompletionDate: ca.target_completion_date,
    status: ca.status,
    createdAt: ca.created_at,
    updatedAt: ca.updated_at,
    completedAt: ca.completed_at,
  }));
}

/**
 * Fetches ALL corrective actions for every NC that belongs to a given audit.
 * Uses two sequential queries (NC ids → CAs) to avoid a client-side N+1 loop.
 * Returns a map keyed by non_conformity_id for O(1) look-up in child components.
 */
export async function getCorrectiveActionsByAudit(
  auditId: string
): Promise<Record<string, CorrectiveAction[]>> {
  const supabase = await createClient();

  // 1. Resolve all NC ids for this audit (fast, indexed query)
  const { data: ncs, error: ncsError } = await supabase
    .from("non_conformities")
    .select("id")
    .eq("audit_id", auditId);

  if (ncsError || !ncs || ncs.length === 0) return {};

  const ncIds = ncs.map((nc: { id: string }) => nc.id);

  // 2. Bulk-fetch all CAs for those NCs in a single round-trip
  const { data, error } = await supabase
    .from("corrective_actions")
    .select("*")
    .in("non_conformity_id", ncIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching corrective actions for audit:", error);
    return {};
  }

  // Group by non_conformity_id
  return (data || []).reduce<Record<string, CorrectiveAction[]>>((acc, ca: any) => {
    const ncId: string = ca.non_conformity_id;
    if (!acc[ncId]) acc[ncId] = [];
    acc[ncId].push({
      id: ca.id,
      nonConformityId: ca.non_conformity_id,
      description: ca.description,
      rootCause: ca.root_cause,
      actionPlan: ca.action_plan,
      responsiblePersonName: ca.responsible_person_name,
      responsiblePersonEmail: ca.responsible_person_email,
      targetCompletionDate: ca.target_completion_date,
      status: ca.status,
      createdAt: ca.created_at,
      updatedAt: ca.updated_at,
      completedAt: ca.completed_at,
    });
    return acc;
  }, {});
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
    targetCompletionDate: data.target_completion_date,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    completedAt: data.completed_at,
  };
}
