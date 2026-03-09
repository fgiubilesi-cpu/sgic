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

    // Log corrective action creation (email notification can be added with Resend or similar service)
    console.log(
      `[CA] Created corrective action ${data.id} for NC ${validated.nonConformityId}`,
      {
        responsible: validated.responsiblePersonName,
        email: validated.responsiblePersonEmail,
        targetDate: validated.targetCompletionDate,
      }
    );

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
      // N5: When AC is verified → NC becomes closed (risolta)
      if (validated.status === "verified") {
        await supabase
          .from("non_conformities")
          .update({ status: "closed", closed_at: new Date().toISOString() })
          .eq("id", ca.non_conformity_id)
          .eq("status", "pending_verification");
      }

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
      // N5: When CA is completed, move NC to "pending_verification"
      await supabase
        .from("non_conformities")
        .update({ status: "pending_verification" })
        .eq("id", ca.non_conformity_id)
        .eq("status", "open");

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
