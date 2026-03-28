"use server";

import type { OrgContext } from "@/lib/supabase/get-org-context";
import type { Json } from "@/types/database.types";

type AppEventInput = {
  action?: "DELETE" | "INSERT" | "UPDATE";
  details?: string | null;
  payload?: Json;
  recordId?: string;
  tableName: string;
  title: string;
};

export async function recordAppEvent(ctx: OrgContext, input: AppEventInput) {
  const event: Json = {
    details: input.details ?? null,
    payload: input.payload ?? null,
    recorded_at: new Date().toISOString(),
    title: input.title,
  };

  const { error } = await ctx.supabase.from("audit_logs").insert({
    action: input.action ?? "INSERT",
    changed_by: ctx.userId,
    new_data: event,
    old_data: null,
    organization_id: ctx.organizationId,
    record_id: input.recordId ?? crypto.randomUUID(),
    table_name: input.tableName,
  });

  if (error) {
    console.error("app event log failed", error);
  }
}
