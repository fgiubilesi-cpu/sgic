"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import {
  createNonConformitySchema,
  updateNonConformitySchema,
  closeNonConformitySchema,
  type CreateNonConformityInput,
  type UpdateNonConformityInput,
  type CloseNonConformityInput,
} from "@/features/audits/schemas/non-conformity-schema";

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function createNonConformity(
  input: CreateNonConformityInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const validated = createNonConformitySchema.parse(input);

    const ctx = await getOrganizationContext();
    if (!ctx) return { success: false, error: "Unauthorized" };

    const { supabase, organizationId } = ctx;

    const { data, error } = await supabase
      .from("non_conformities")
      .insert({
        audit_id: validated.auditId,
        checklist_item_id: validated.checklistItemId,
        title: validated.title,
        description: validated.description,
        severity: validated.severity,
        organization_id: organizationId,
      })
      .select("id")
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/audits/${validated.auditId}`);

    return { success: true, data: { id: data.id } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function updateNonConformity(
  input: UpdateNonConformityInput
): Promise<ActionResult<null>> {
  try {
    const validated = updateNonConformitySchema.parse(input);

    const ctx = await getOrganizationContext();
    if (!ctx) return { success: false, error: "Unauthorized" };

    const { supabase, organizationId } = ctx;

    // Verify non-conformity belongs to user's organization
    const { data: nc, error: ncError } = await supabase
      .from("non_conformities")
      .select("organization_id")
      .eq("id", validated.id)
      .single();

    if (ncError || !nc || nc.organization_id !== organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const { error: updateError } = await supabase
      .from("non_conformities")
      .update({
        title: validated.title,
        description: validated.description,
        severity: validated.severity,
        status: validated.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", validated.id)
      .eq("organization_id", organizationId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { data: ncUpdated } = await supabase
      .from("non_conformities")
      .select("audit_id")
      .eq("id", validated.id)
      .single();

    if (ncUpdated?.audit_id) {
      revalidatePath(`/audits/${ncUpdated.audit_id}`);
    }

    return { success: true, data: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function closeNonConformity(
  input: CloseNonConformityInput
): Promise<ActionResult<null>> {
  try {
    const validated = closeNonConformitySchema.parse(input);

    const ctx = await getOrganizationContext();
    if (!ctx) return { success: false, error: "Unauthorized" };

    const { supabase, organizationId } = ctx;

    // Verify non-conformity belongs to user's organization
    const { data: nc, error: ncError } = await supabase
      .from("non_conformities")
      .select("organization_id")
      .eq("id", validated.id)
      .single();

    if (ncError || !nc || nc.organization_id !== organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const now = new Date().toISOString();
    const { error: closeError } = await supabase
      .from("non_conformities")
      .update({
        status: "closed",
        closed_at: now,
        updated_at: now,
      })
      .eq("id", validated.id)
      .eq("organization_id", organizationId);

    if (closeError) {
      return { success: false, error: closeError.message };
    }

    const { data: ncUpdated } = await supabase
      .from("non_conformities")
      .select("audit_id")
      .eq("id", validated.id)
      .single();

    if (ncUpdated?.audit_id) {
      revalidatePath(`/audits/${ncUpdated.audit_id}`);
    }

    return { success: true, data: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
