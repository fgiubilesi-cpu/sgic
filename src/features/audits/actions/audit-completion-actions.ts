"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const completeAuditSchema = z.object({
  auditId: z.string().uuid("Invalid audit ID"),
  conclusionNotes: z.string().optional(),
});

type AuditCompletionInput = z.infer<typeof completeAuditSchema>;
type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

export async function completeAudit(
  input: AuditCompletionInput
): Promise<ActionResult<{ completedAt: string }>> {
  try {
    const validated = completeAuditSchema.parse(input);
    const supabase = await createServerClient();

    const completedAt = new Date().toISOString();

    const { error } = await supabase
      .from("audits")
      .update({
        status: "completed",
        updated_at: completedAt,
      })
      .eq("id", validated.auditId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath(`/audits/${validated.auditId}`);
    revalidatePath("/audits");

    return { success: true, data: { completedAt } };
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
    const supabase = await createServerClient();

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
