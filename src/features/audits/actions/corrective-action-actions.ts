"use server";

import { revalidatePath } from "next/cache";
import { assertInternalOperator } from "@/lib/access-control";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import {
  normalizeCorrectiveActionDateFields,
} from "@/features/quality/lib/nc-ac-contract";
import { syncNonConformityStatusFromCorrectiveActions } from "@/features/quality/lib/nc-ac-status-sync";
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
    try {
      assertInternalOperator(ctx, "azioni correttive audit");
    } catch {
      return { success: false, error: "Unauthorized" };
    }

    const { supabase, organizationId } = ctx;
    const dateFields = normalizeCorrectiveActionDateFields({
      targetCompletionDate: validated.targetCompletionDate,
    });

    const { data, error } = await supabase
      .from("corrective_actions")
      .insert({
        non_conformity_id: validated.nonConformityId,
        description: validated.description,
        root_cause: validated.rootCause,
        action_plan: validated.actionPlan,
        responsible_person_name: validated.responsiblePersonName,
        responsible_person_email: validated.responsiblePersonEmail,
        ...dateFields,
        organization_id: organizationId,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await syncNonConformityStatusFromCorrectiveActions({
      nonConformityId: validated.nonConformityId,
      supabase,
    });

    const { data: nc } = await supabase
      .from("non_conformities")
      .select("audit_id")
      .eq("id", validated.nonConformityId)
      .is("deleted_at", null)
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
    try {
      assertInternalOperator(ctx, "azioni correttive audit");
    } catch {
      return { success: false, error: "Unauthorized" };
    }

    const { supabase } = ctx;
    const hasDatePatch =
      Object.prototype.hasOwnProperty.call(validated, "dueDate") ||
      Object.prototype.hasOwnProperty.call(validated, "targetCompletionDate");
    const datePatch = hasDatePatch
      ? normalizeCorrectiveActionDateFields({
          dueDate: validated.dueDate,
          targetCompletionDate: validated.targetCompletionDate,
        })
      : {};

    const { error } = await supabase
      .from("corrective_actions")
      .update({
        description: validated.description,
        root_cause: validated.rootCause,
        action_plan: validated.actionPlan,
        responsible_person_name: validated.responsiblePersonName,
        responsible_person_email: validated.responsiblePersonEmail,
        ...datePatch,
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
      .is("deleted_at", null)
      .single();

    if (ca?.non_conformity_id) {
      await syncNonConformityStatusFromCorrectiveActions({
        nonConformityId: ca.non_conformity_id,
        supabase,
      });

      const { data: nc } = await supabase
        .from("non_conformities")
        .select("audit_id")
        .eq("id", ca.non_conformity_id)
        .is("deleted_at", null)
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

export async function deleteCorrectiveAction(
  id: string
): Promise<ActionResult<null>> {
  try {
    const ctx = await getOrganizationContext();
    try {
      assertInternalOperator(ctx, "azioni correttive audit");
    } catch {
      return { success: false, error: "Unauthorized" };
    }

    const { supabase } = ctx;

    const { data: ca } = await supabase
      .from("corrective_actions")
      .select("non_conformity_id")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("corrective_actions")
      .update({ deleted_at: now, updated_at: now })
      .eq("id", id);

    if (error) {
      return { success: false, error: error.message };
    }

    if (ca?.non_conformity_id) {
      await syncNonConformityStatusFromCorrectiveActions({
        nonConformityId: ca.non_conformity_id,
        supabase,
      });

      const { data: nc } = await supabase
        .from("non_conformities")
        .select("audit_id")
        .eq("id", ca.non_conformity_id)
        .is("deleted_at", null)
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
    try {
      assertInternalOperator(ctx, "azioni correttive audit");
    } catch {
      return { success: false, error: "Unauthorized" };
    }

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
      .is("deleted_at", null)
      .single();

    if (ca?.non_conformity_id) {
      await syncNonConformityStatusFromCorrectiveActions({
        nonConformityId: ca.non_conformity_id,
        supabase,
      });

      const { data: nc } = await supabase
        .from("non_conformities")
        .select("audit_id")
        .eq("id", ca.non_conformity_id)
        .is("deleted_at", null)
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
