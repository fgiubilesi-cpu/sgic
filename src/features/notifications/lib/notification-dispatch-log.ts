"use server";

import type { OrgContext } from "@/lib/supabase/get-org-context";
import type { Json } from "@/types/database.types";
import { recordAppEvent } from "@/lib/app-event-log";
import type {
  NotificationDispatchStatus,
  NotificationSeverity,
} from "@/features/notifications/lib/notification-center";
import {
  parseOrganizationConsoleConfig,
  type OrganizationNotificationsConfig,
} from "@/features/organization/lib/organization-console-config";

type NotificationDispatchInput = {
  audience: OrganizationNotificationsConfig["audience"];
  channel: "dashboard" | "email";
  details?: string | null;
  payload?: Json;
  recipient?: string | null;
  severity: NotificationSeverity;
  status: NotificationDispatchStatus;
  targetRef?: string | null;
  title: string;
  type: string;
};

export async function recordNotificationDispatch(
  ctx: OrgContext,
  input: NotificationDispatchInput
) {
  const payload: Json = {
    audience: input.audience,
    channel: input.channel,
    details: input.details ?? null,
    recipient: input.recipient ?? null,
    sent_at: new Date().toISOString(),
    severity: input.severity,
    status: input.status,
    target_ref: input.targetRef ?? null,
    type: input.type,
    payload: input.payload ?? null,
  };

  await recordAppEvent(ctx, {
    action: "INSERT",
    details: input.details ?? null,
    payload,
    recordId: input.targetRef ?? crypto.randomUUID(),
    tableName: "notification_dispatches",
    title: input.title,
  });
}

export async function getNotificationDispatchAudience(
  ctx: OrgContext
): Promise<OrganizationNotificationsConfig["audience"]> {
  const { data: organization } = await ctx.supabase
    .from("organizations")
    .select("settings")
    .eq("id", ctx.organizationId)
    .single();

  return parseOrganizationConsoleConfig(organization?.settings).notifications.audience;
}
