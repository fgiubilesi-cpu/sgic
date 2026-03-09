"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationContext, type OrgContext } from "@/lib/supabase/get-org-context";
import { z } from "zod";

const completeAuditSchema = z.object({
  auditId: z.string().uuid("Invalid audit ID"),
  conclusionNotes: z.string().optional(),
});

type AuditCompletionInput = z.infer<typeof completeAuditSchema>;
type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

type CompletionValidation = {
  isValid: boolean;
  errors: string[];
  pendingItems: number;
  nonCompliantWithoutNC: number;
};

/**
 * Validate audit completion readiness:
 * 1. All checklist items must have an outcome (not "pending")
 * 2. All non_compliant items must have a non_conformity record
 */
async function validateAuditCompletion(
  auditId: string,
  ctx: OrgContext
): Promise<CompletionValidation> {
  const { supabase } = ctx;
  const errors: string[] = [];

  const { data: items, error: itemsError } = await supabase
    .from("checklist_items")
    .select("id, outcome")
    .eq("audit_id", auditId);

  if (itemsError) {
    return { isValid: false, errors: [itemsError.message], pendingItems: 0, nonCompliantWithoutNC: 0 };
  }

  const pendingItems = items?.filter((i: any) => i.outcome === "pending").length || 0;
  if (pendingItems > 0) {
    errors.push(
      `${pendingItems} checklist item(s) still have "pending" outcome. All items must be evaluated.`
    );
  }

  const { data: nonCompliantItems, error: ncItemsError } = await supabase
    .from("checklist_items")
    .select("id")
    .eq("audit_id", auditId)
    .eq("outcome", "non_compliant");

  if (ncItemsError) {
    return { isValid: false, errors: [ncItemsError.message], pendingItems, nonCompliantWithoutNC: 0 };
  }

  let nonCompliantWithoutNC = 0;
  if (nonCompliantItems && nonCompliantItems.length > 0) {
    const { data: nonConformities, error: ncError } = await supabase
      .from("non_conformities")
      .select("checklist_item_id")
      .eq("audit_id", auditId)
      .in("checklist_item_id", nonCompliantItems.map((item: any) => item.id));

    if (ncError) {
      return { isValid: false, errors: [ncError.message], pendingItems, nonCompliantWithoutNC: 0 };
    }

    const ncItemIds = new Set(nonConformities?.map((nc: any) => nc.checklist_item_id) || []);
    nonCompliantWithoutNC = nonCompliantItems.filter((item: any) => !ncItemIds.has(item.id)).length;

    if (nonCompliantWithoutNC > 0) {
      errors.push(
        `${nonCompliantWithoutNC} non-compliant item(s) do not have associated non-conformity records.`
      );
    }
  }

  return { isValid: errors.length === 0, errors, pendingItems, nonCompliantWithoutNC };
}

export async function completeAudit(
  input: AuditCompletionInput
): Promise<ActionResult<{ completedAt: string; validation: CompletionValidation }>> {
  try {
    const validated = completeAuditSchema.parse(input);

    const ctx = await getOrganizationContext();
    if (!ctx) return { success: false, error: "Unauthorized" };

    const { supabase, userId, organizationId } = ctx;

    // Verify audit belongs to user's organization
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select("organization_id, status")
      .eq("id", validated.auditId)
      .single();

    if (auditError || !audit || audit.organization_id !== organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    const validation = await validateAuditCompletion(validated.auditId, ctx);

    if (!validation.isValid) {
      return {
        success: false,
        error: `Audit cannot be moved to Review status: ${validation.errors.join(" ")}`,
      };
    }

    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("audits")
      .update({ status: "Review" })
      .eq("id", validated.auditId)
      .eq("organization_id", organizationId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { error: trailError } = await supabase
      .from("audit_trail")
      .insert({
        audit_id: validated.auditId,
        organization_id: organizationId,
        old_status: audit.status || null,
        new_status: "Review",
        changed_by: userId,
        changed_at: completedAt,
      });

    if (trailError) {
      console.error("Failed to log audit trail:", trailError);
    }

    revalidatePath(`/audits/${validated.auditId}`);
    revalidatePath("/audits");

    return { success: true, data: { completedAt, validation } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Close an audit that is in Review status.
 * Moves audit from Review → Closed.
 */
export async function closeAudit(
  input: { auditId: string }
): Promise<ActionResult<{ closedAt: string }>> {
  try {
    const ctx = await getOrganizationContext();
    if (!ctx) return { success: false, error: "Unauthorized" };

    const { supabase, userId, organizationId } = ctx;

    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select("organization_id, status")
      .eq("id", input.auditId)
      .single();

    if (auditError || !audit || audit.organization_id !== organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    if (audit.status !== "Review") {
      return {
        success: false,
        error: `Audit is in ${audit.status} status. Only audits in Review status can be closed.`,
      };
    }

    const closedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("audits")
      .update({ status: "Closed" })
      .eq("id", input.auditId)
      .eq("organization_id", organizationId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    const { error: trailError } = await supabase
      .from("audit_trail")
      .insert({
        audit_id: input.auditId,
        organization_id: organizationId,
        old_status: "Review",
        new_status: "Closed",
        changed_by: userId,
        changed_at: closedAt,
      });

    if (trailError) {
      console.error("Failed to log audit trail:", trailError);
    }

    revalidatePath(`/audits/${input.auditId}`);
    revalidatePath("/audits");

    return { success: true, data: { closedAt } };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
