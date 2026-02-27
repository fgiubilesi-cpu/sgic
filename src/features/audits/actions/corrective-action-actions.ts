"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
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
    const supabase = await createServerClient();

    // Get current user's organization
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return { success: false, error: "Organization not found" };
    }

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
        organization_id: profile.organization_id,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Revalidate the audit path
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
    const supabase = await createServerClient();

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

    // Get non-conformity and audit IDs to revalidate
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
    const supabase = await createServerClient();

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

    // Get non-conformity and audit IDs to revalidate
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
