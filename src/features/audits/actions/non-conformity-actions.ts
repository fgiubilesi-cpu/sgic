"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
    const supabase = await createClient();

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
      .from("non_conformities")
      .insert({
        audit_id: validated.auditId,
        checklist_item_id: validated.checklistItemId,
        title: validated.title,
        description: validated.description,
        severity: validated.severity,
        organization_id: profile.organization_id,
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
    const supabase = await createClient();

    // Security: Verify user's organization owns this non-conformity
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

    // Verify non-conformity belongs to user's organization
    const { data: nc, error: ncError } = await supabase
      .from("non_conformities")
      .select("organization_id")
      .eq("id", validated.id)
      .single();

    if (ncError || !nc || nc.organization_id !== profile.organization_id) {
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
      .eq("organization_id", profile.organization_id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Get the audit ID to revalidate the correct path
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
    const supabase = await createClient();

    // Security: Verify user's organization owns this non-conformity
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

    // Verify non-conformity belongs to user's organization
    const { data: nc, error: ncError } = await supabase
      .from("non_conformities")
      .select("organization_id")
      .eq("id", validated.id)
      .single();

    if (ncError || !nc || nc.organization_id !== profile.organization_id) {
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
      .eq("organization_id", profile.organization_id);

    if (closeError) {
      return { success: false, error: closeError.message };
    }

    // Get the audit ID to revalidate the correct path
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
