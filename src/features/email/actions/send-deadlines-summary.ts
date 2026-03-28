"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { getUnifiedDeadlines } from "@/features/deadlines/queries/get-unified-deadlines";
import { getResendClient, FROM_EMAIL, ADMIN_EMAIL } from "@/lib/email/resend-client";
import {
  buildDeadlinesSummaryEmail,
  type DeadlineSummaryItem,
} from "@/lib/email/templates";
import {
  getNotificationDispatchAudience,
  recordNotificationDispatch,
} from "@/features/notifications/lib/notification-dispatch-log";

export type SendDeadlinesSummaryResult =
  | { success: true; sent: number; to: string }
  | { success: false; error: string };

export async function sendDeadlinesSummaryAction(
  clientId?: string
): Promise<SendDeadlinesSummaryResult> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { success: false, error: "Non autenticato." };
  if (ctx.role !== "admin" && ctx.role !== "inspector") {
    return { success: false, error: "Permesso negato." };
  }
  const audience = await getNotificationDispatchAudience(ctx);

  // Fetch all deadlines (overdue + next 90 days)
  const deadlines = await getUnifiedDeadlines({
    clientId: clientId || undefined,
  });

  // Filter to overdue + within 30 days for the summary email
  const relevant = deadlines.filter((d) => d.daysUntil <= 30);

  if (relevant.length === 0) {
    await recordNotificationDispatch(ctx, {
      audience,
      channel: "email",
      details: "Nessuna scadenza imminente entro 30 giorni.",
      payload: {
        client_id: clientId ?? null,
        items_count: 0,
      },
      recipient: ADMIN_EMAIL,
      severity: "warning",
      status: "skipped",
      targetRef: clientId ?? null,
      title: "Riepilogo scadenze",
      type: "deadlines_summary",
    });
    return {
      success: false,
      error: "Nessuna scadenza imminente (entro 30 giorni) da inviare.",
    };
  }

  const items: DeadlineSummaryItem[] = relevant.map((d) => ({
    type: d.type,
    title: d.title,
    description: d.description,
    clientName: d.clientName,
    dueDate: d.dueDate,
    daysUntil: d.daysUntil,
  }));

  const generatedAt = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const { subject, html } = buildDeadlinesSummaryEmail(items, generatedAt);

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      html,
    });
    await recordNotificationDispatch(ctx, {
      audience,
      channel: "email",
      details: `${items.length} scadenze inviate nel digest.`,
      payload: {
        client_id: clientId ?? null,
        items_count: items.length,
      },
      recipient: ADMIN_EMAIL,
      severity: relevant.some((item) => item.daysUntil < 0) ? "danger" : "warning",
      status: "sent",
      targetRef: clientId ?? null,
      title: "Riepilogo scadenze",
      type: "deadlines_summary",
    });
    revalidatePath("/notifications");
    return { success: true, sent: items.length, to: ADMIN_EMAIL };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore invio email.";
    await recordNotificationDispatch(ctx, {
      audience,
      channel: "email",
      details: message,
      payload: {
        client_id: clientId ?? null,
        items_count: items.length,
      },
      recipient: ADMIN_EMAIL,
      severity: "warning",
      status: "failed",
      targetRef: clientId ?? null,
      title: "Riepilogo scadenze",
      type: "deadlines_summary",
    });
    revalidatePath("/notifications");
    return { success: false, error: message };
  }
}
