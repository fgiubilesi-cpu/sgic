"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import {
  createCorrectiveActionSchema,
  updateCorrectiveActionSchema,
  completeCorrectiveActionSchema,
  type CreateCorrectiveActionInput,
  type UpdateCorrectiveActionInput,
  type CompleteCorrectiveActionInput,
} from "@/features/audits/schemas/corrective-action-schema";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createCorrectiveAction(
  input: CreateCorrectiveActionInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = createCorrectiveActionSchema.parse(input);

    const ctx = await getOrganizationContext();
    if (!ctx) return { success: false, error: "Unauthorized" };

    const { supabase, organizationId } = ctx;

    const { data, error } = await supabase
      .from("corrective_actions")
      .insert({
        non_conformity_id: validated.nonConformityId,
        description: validated.description,
        root_cause: validated.rootCause,
        action_plan: validated.actionPlan,
        responsible_person_name: validated.responsiblePersonName,
        responsible_person_email: validated.responsiblePersonEmail,
        target_completion_date: validated.targetCompletionDate,
        organization_id: organizationId,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: nc } = await supabase
      .from("non_conformities")
      .select("audit_id")
      .eq("id", validated.nonConformityId)
      .single();

    if (nc?.audit_id) {
      revalidatePath(`/audits/${nc.audit_id}`);
    }

    return { success: true, data: { id: data.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function updateCorrectiveAction(
  input: UpdateCorrectiveActionInput
): Promise<ActionResult<null>> {
  try {
    const validated = updateCorrectiveActionSchema.parse(input);

    // updateCorrectiveAction doesn't need org-scoping (RLS protects it)
    // but we reuse the context for the supabase client
    const ctx = await getOrganizationContext();
    if (!ctx) return { success: false, error: "Unauthorized" };

    const { supabase } = ctx;

    const { error } = await supabase
      .from("corrective_actions")
      .update({
        description: validated.description,
        root_cause: validated.rootCause,
        action_plan: validated.actionPlan,
        responsible_person_name: validated.responsiblePersonName,
        responsible_person_email: validated.responsiblePersonEmail,
        target_completion_date: validated.targetCompletionDate,
        status: validated.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.id);

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: ca } = await supabase
      .from("corrective_actions")
      .select("non_conformity_id")
      .eq("id", validated.id)
      .single();

    if (ca?.non_conformity_id) {
      const { data: nc } = await supabase
        .from("non_conformities")
        .select("audit_id")
        .eq("id", ca.non_conformity_id)
        .single();

      if (nc?.audit_id) {
        revalidatePath(`/audits/${nc.audit_id}`);
      }
    }

    return { success: true, data: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function completeCorrectiveAction(
  input: CompleteCorrectiveActionInput
): Promise<ActionResult<null>> {
  try {
    const validated = completeCorrectiveActionSchema.parse(input);

    const ctx = await getOrganizationContext();
    if (!ctx) return { success: false, error: "Unauthorized" };

    const { supabase } = ctx;

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("corrective_actions")
      .update({
        status: "completed",
        completed_at: now,
        updated_at: now,
      })
      .eq("id", validated.id);

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: ca } = await supabase
      .from("corrective_actions")
      .select("non_conformity_id")
      .eq("id", validated.id)
      .single();

    if (ca?.non_conformity_id) {
      const { data: nc } = await supabase
        .from("non_conformities")
        .select("audit_id")
        .eq("id", ca.non_conformity_id)
        .single();

      if (nc?.audit_id) {
        revalidatePath(`/audits/${nc.audit_id}`);
      }
    }

    return { success: true, data: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
