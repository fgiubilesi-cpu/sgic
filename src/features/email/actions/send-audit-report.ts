"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { getResendClient, FROM_EMAIL } from "@/lib/email/resend-client";
import { buildAuditReportEmail, type AuditReportData } from "@/lib/email/templates";
import {
  getNotificationDispatchAudience,
  recordNotificationDispatch,
} from "@/features/notifications/lib/notification-dispatch-log";

export type SendAuditReportResult =
  | { success: true; to: string }
  | { success: false; error: string };

export async function sendAuditReportAction(
  auditId: string,
  recipientEmail: string
): Promise<SendAuditReportResult> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { success: false, error: "Non autenticato." };
  if (ctx.role !== "admin" && ctx.role !== "inspector") {
    return { success: false, error: "Permesso negato." };
  }
  const audience = await getNotificationDispatchAudience(ctx);

  const { supabase, organizationId } = ctx;

  // Fetch audit with client + location
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("id, title, scheduled_date, score, client:client_id(name), location:location_id(name)")
    .eq("id", auditId)
    .eq("organization_id", organizationId)
    .single();

  if (auditError || !audit) {
    return { success: false, error: "Audit non trovato." };
  }

  // Fetch NCs for this audit
  const { data: ncs } = await supabase
    .from("non_conformities")
    .select("id, title, severity, status")
    .eq("audit_id", auditId)
    .is("deleted_at", null);

  const ncList = (ncs ?? []).map((nc) => ({
    title: nc.title ?? "NC",
    severity: nc.severity ?? "minor",
    status: nc.status ?? "open",
  }));

  const openNCs = ncList.filter((nc) => nc.status === "open").length;

  // Fetch pending ACs
  const ncIds = (ncs ?? []).map((nc) => nc.id);
  let pendingACs = 0;
  if (ncIds.length > 0) {
    const { count } = await supabase
      .from("corrective_actions")
      .select("id", { count: "exact", head: true })
      .in("non_conformity_id", ncIds)
      .is("deleted_at", null)
      .neq("status", "completed");
    pendingACs = count ?? 0;
  }

  const client = audit.client as unknown as { name: string } | null;
  const location = audit.location as unknown as { name: string } | null;

  const reportData: AuditReportData = {
    auditTitle: audit.title ?? "Audit",
    clientName: client?.name ?? "—",
    locationName: location?.name ?? "—",
    scheduledDate: audit.scheduled_date as string | null,
    score: audit.score as number | null,
    openNCs,
    totalNCs: ncList.length,
    pendingACs,
    ncList,
  };

  const { subject, html } = buildAuditReportEmail(reportData);

  try {
    const resend = getResendClient();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      html,
    });
    await recordNotificationDispatch(ctx, {
      audience,
      channel: "email",
      details: `Report audit inviato a ${recipientEmail}.`,
      payload: {
        audit_id: auditId,
        pending_acs: pendingACs,
        total_ncs: ncList.length,
      },
      recipient: recipientEmail,
      severity: "default",
      status: "sent",
      targetRef: auditId,
      title: "Invio report audit",
      type: "audit_report",
    });
    revalidatePath("/notifications");
    return { success: true, to: recipientEmail };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore invio email.";
    await recordNotificationDispatch(ctx, {
      audience,
      channel: "email",
      details: message,
      payload: {
        audit_id: auditId,
      },
      recipient: recipientEmail,
      severity: "default",
      status: "failed",
      targetRef: auditId,
      title: "Invio report audit",
      type: "audit_report",
    });
    revalidatePath("/notifications");
    return { success: false, error: message };
  }
}
