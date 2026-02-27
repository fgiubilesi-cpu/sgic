"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<CompletionValidation> {
  const errors: string[] = [];

  // 1. Check for pending checklist items
  const { data: items, error: itemsError } = await supabase
    .from("checklist_items")
    .select("id, outcome")
    .eq("audit_id", auditId);

  if (itemsError) {
    return {
      isValid: false,
      errors: [itemsError.message],
      pendingItems: 0,
      nonCompliantWithoutNC: 0,
    };
  }

  const pendingItems = items?.filter((i: any) => i.outcome === "pending").length || 0;
  if (pendingItems > 0) {
    errors.push(
      `${pendingItems} checklist item(s) still have "pending" outcome. All items must be evaluated.`
    );
  }

  // 2. Check for non_compliant items without non_conformity records
  const { data: nonCompliantItems, error: ncItemsError } = await supabase
    .from("checklist_items")
    .select("id")
    .eq("audit_id", auditId)
    .eq("outcome", "non_compliant");

  if (ncItemsError) {
    return {
      isValid: false,
      errors: [ncItemsError.message],
      pendingItems,
      nonCompliantWithoutNC: 0,
    };
  }

  let nonCompliantWithoutNC = 0;
  if (nonCompliantItems && nonCompliantItems.length > 0) {
    const { data: nonConformities, error: ncError } = await supabase
      .from("non_conformities")
      .select("checklist_item_id")
      .eq("audit_id", auditId)
      .in(
        "checklist_item_id",
        nonCompliantItems.map((item: any) => item.id)
      );

    if (ncError) {
      return {
        isValid: false,
        errors: [ncError.message],
        pendingItems,
        nonCompliantWithoutNC: 0,
      };
    }

    const ncItemIds = new Set(
      nonConformities?.map((nc: any) => nc.checklist_item_id) || []
    );
    nonCompliantWithoutNC = nonCompliantItems.filter(
      (item: any) => !ncItemIds.has(item.id)
    ).length;

    if (nonCompliantWithoutNC > 0) {
      errors.push(
        `${nonCompliantWithoutNC} non-compliant item(s) do not have associated non-conformity records.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    pendingItems,
    nonCompliantWithoutNC,
  };
}

export async function completeAudit(
  input: AuditCompletionInput
): Promise<ActionResult<{ completedAt: string; validation: CompletionValidation }>> {
  try {
    const validated = completeAuditSchema.parse(input);
    const supabase = await createClient();

    // Security: Verify user's organization owns this audit
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

    // Verify audit belongs to user's organization
    const { data: audit, error: auditError } = await supabase
      .from("audits")
      .select("organization_id")
      .eq("id", validated.auditId)
      .single();

    if (auditError || !audit || audit.organization_id !== profile.organization_id) {
      return { success: false, error: "Unauthorized" };
    }

    // Validate completion readiness
    const validation = await validateAuditCompletion(validated.auditId, supabase);

    if (!validation.isValid) {
      return {
        success: false,
        error: `Audit cannot be moved to Review status: ${validation.errors.join(" ")}`,
      };
    }

    // Get current audit status before change
    const { data: currentAudit } = await supabase
      .from("audits")
      .select("status")
      .eq("id", validated.auditId)
      .single();

    // Update audit status to "Review" (new enum value - next step before "Closed")
    const completedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("audits")
      .update({
        status: "Review",
        updated_at: completedAt,
      })
      .eq("id", validated.auditId)
      .eq("organization_id", profile.organization_id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // Log status change to audit trail
    const { error: trailError } = await supabase
      .from("audit_trail")
      .insert({
        audit_id: validated.auditId,
        organization_id: profile.organization_id,
        old_status: currentAudit?.status || null,
        new_status: "Review",
        changed_by: user.id,
        changed_at: completedAt,
      });

    if (trailError) {
      console.error("Failed to log audit trail:", trailError);
      // Don't fail the operation if trail logging fails
    }

    revalidatePath(`/audits/${validated.auditId}`);
    revalidatePath("/audits");

    return {
      success: true,
      data: { completedAt, validation },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

/**
 * Generate audit summary statistics
 */
export async function getAuditSummary(
  auditId: string
): Promise<ActionResult<{
  totalItems: number;
  compliant: number;
  nonCompliant: number;
  notApplicable: number;
  pending: number;
  compliancePercentage: number;
  nonConformitiesCount: number;
  openNonConformities: number;
  completedActions: number;
  pendingActions: number;
}>> {
  try {
    const supabase = await createClient();

    // Get checklist items summary
    const { data: items, error: itemsError } = await supabase
      .from("checklist_items")
      .select("outcome")
      .eq("audit_id", auditId);

    if (itemsError) {
      return { success: false, error: itemsError.message };
    }

    const itemsSummary = {
      total: items?.length || 0,
      compliant: items?.filter((i: any) => i.outcome === "compliant").length || 0,
      nonCompliant:
        items?.filter((i: any) => i.outcome === "non_compliant").length || 0,
      notApplicable:
        items?.filter((i: any) => i.outcome === "not_applicable").length || 0,
      pending: items?.filter((i: any) => i.outcome === "pending").length || 0,
    };

    const compliancePercentage =
      itemsSummary.total > 0
        ? Math.round(
            ((itemsSummary.compliant + itemsSummary.notApplicable) /
              itemsSummary.total) *
              100
          )
        : 0;

    // Get non-conformities summary
    const { data: ncs, error: ncsError } = await supabase
      .from("non_conformities")
      .select("status")
      .eq("audit_id", auditId);

    if (ncsError) {
      return { success: false, error: ncsError.message };
    }

    const ncsSummary = {
      total: ncs?.length || 0,
      open: ncs?.filter((n: any) => n.status === "open").length || 0,
    };

    // Get corrective actions summary for this audit's NCs
    const { data: cas, error: casError } = await supabase
      .from("corrective_actions")
      .select("status, non_conformity_id")
      .in(
        "non_conformity_id",
        ncs?.map((n: any) => n.id) || []
      );

    if (casError) {
      return { success: false, error: casError.message };
    }

    const casSummary = {
      completed: cas?.filter((c: any) => c.status === "completed").length || 0,
      pending: cas?.filter((c: any) => c.status === "pending").length || 0,
    };

    return {
      success: true,
      data: {
        totalItems: itemsSummary.total,
        compliant: itemsSummary.compliant,
        nonCompliant: itemsSummary.nonCompliant,
        notApplicable: itemsSummary.notApplicable,
        pending: itemsSummary.pending,
        compliancePercentage,
        nonConformitiesCount: ncsSummary.total,
        openNonConformities: ncsSummary.open,
        completedActions: casSummary.completed,
        pendingActions: casSummary.pending,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
