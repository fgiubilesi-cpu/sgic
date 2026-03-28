import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

import { normalizeCorrectiveActionStatus, normalizeNonConformityStatus } from "./nc-ac-contract";
import { resolveNonConformityStatusFromCorrectiveActions } from "./nc-ac-workflow";

export async function syncNonConformityStatusFromCorrectiveActions(params: {
  nonConformityId: string;
  supabase: SupabaseClient<Database>;
}): Promise<"closed" | "open" | "pending_verification" | null> {
  const { nonConformityId, supabase } = params;

  const [{ data: nonConformity, error: nonConformityError }, { data: correctiveActions, error: correctiveActionsError }] =
    await Promise.all([
      supabase
        .from("non_conformities")
        .select("status, closed_at")
        .eq("id", nonConformityId)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("corrective_actions")
        .select("status")
        .eq("non_conformity_id", nonConformityId)
        .is("deleted_at", null),
    ]);

  if (nonConformityError || !nonConformity || correctiveActionsError) {
    return null;
  }

  const currentStatus = normalizeNonConformityStatus(nonConformity.status);
  const nextStatus = resolveNonConformityStatusFromCorrectiveActions(
    currentStatus,
    (correctiveActions ?? []).map((action) => ({
      status: normalizeCorrectiveActionStatus(action.status),
    }))
  );

  if (nextStatus === currentStatus) {
    return nextStatus;
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("non_conformities")
    .update({
      closed_at: nextStatus === "closed" ? nonConformity.closed_at ?? now : null,
      status: nextStatus,
      updated_at: now,
    })
    .eq("id", nonConformityId);

  if (updateError) {
    return null;
  }

  return nextStatus;
}
