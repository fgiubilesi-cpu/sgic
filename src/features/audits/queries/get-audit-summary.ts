import { createClient } from "@/lib/supabase/server";

export interface AuditSummary {
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
}

/**
 * Fetches aggregate statistics for an audit.
 * Server-side only (uses next/headers via createClient).
 * Called from page.tsx and passed as a prop — never called from a Client Component.
 */
export async function getAuditSummary(auditId: string): Promise<AuditSummary> {
  const supabase = await createClient();

  // ── Checklist items ──────────────────────────────────────────────────────────
  const { data: items } = await supabase
    .from("checklist_items")
    .select("outcome")
    .eq("audit_id", auditId);

  const safeItems = items ?? [];
  const compliant = safeItems.filter((i: any) => i.outcome === "compliant").length;
  const nonCompliant = safeItems.filter((i: any) => i.outcome === "non_compliant").length;
  const notApplicable = safeItems.filter((i: any) => i.outcome === "not_applicable").length;
  const pending = safeItems.filter((i: any) => i.outcome === "pending").length;
  const totalItems = safeItems.length;
  const compliancePercentage =
    totalItems > 0
      ? Math.round(((compliant + notApplicable) / totalItems) * 100)
      : 0;

  // ── Non-conformities ─────────────────────────────────────────────────────────
  // Select both `id` and `status` — id is required for the CA query below.
  const { data: ncs } = await supabase
    .from("non_conformities")
    .select("id, status")
    .eq("audit_id", auditId);

  const safeNcs = ncs ?? [];
  const nonConformitiesCount = safeNcs.length;
  const openNonConformities = safeNcs.filter((n: any) => n.status === "open").length;

  // ── Corrective actions ───────────────────────────────────────────────────────
  const ncIds = safeNcs.map((n: any) => n.id as string);
  let completedActions = 0;
  let pendingActions = 0;

  if (ncIds.length > 0) {
    const { data: cas } = await supabase
      .from("corrective_actions")
      .select("status")
      .in("non_conformity_id", ncIds);

    const safeCas = cas ?? [];
    completedActions = safeCas.filter((c: any) => c.status === "completed").length;
    pendingActions = safeCas.filter((c: any) => c.status === "pending").length;
  }

  return {
    totalItems,
    compliant,
    nonCompliant,
    notApplicable,
    pending,
    compliancePercentage,
    nonConformitiesCount,
    openNonConformities,
    completedActions,
    pendingActions,
  };
}
