"use server";

import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { getResendClient, FROM_EMAIL } from "@/lib/email/resend-client";
import {
  buildOverdueACEmail,
  type OverdueACItem,
} from "@/lib/email/templates";

export type SendOverdueACResult =
  | { success: true; sent: number; skipped: number }
  | { success: false; error: string };

export async function sendOverdueACNotificationsAction(
  clientId?: string
): Promise<SendOverdueACResult> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { success: false, error: "Non autenticato." };
  if (ctx.role !== "admin" && ctx.role !== "inspector") {
    return { success: false, error: "Permesso negato." };
  }

  const { supabase, organizationId } = ctx;
  const today = new Date().toISOString().split("T")[0];

  // Fetch overdue ACs with responsible_person_email
  const { data: cas, error } = await supabase
    .from("corrective_actions")
    .select(
      `id, description, due_date, responsible_person_name, responsible_person_email,
       non_conformity:non_conformity_id(
         title,
         audit:audit_id(
           client_id,
           client:client_id(name)
         )
       )`
    )
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .neq("status", "completed")
    .not("due_date", "is", null)
    .lt("due_date", today);

  if (error) {
    return { success: false, error: error.message };
  }

  const items = (cas ?? []).filter((ca) => {
    // filter by clientId if provided
    if (!clientId) return true;
    const nc = ca.non_conformity as unknown as Record<string, unknown> | null;
    const audit = nc?.audit as unknown as Record<string, unknown> | null;
    return audit?.client_id === clientId;
  });

  let sent = 0;
  let skipped = 0;

  const resend = getResendClient();

  for (const ca of items) {
    const email = ca.responsible_person_email as string | null;
    if (!email) {
      skipped++;
      continue;
    }

    const nc = ca.non_conformity as unknown as Record<string, unknown> | null;
    const audit = nc?.audit as unknown as Record<string, unknown> | null;
    const client = audit?.client as unknown as Record<string, unknown> | null;

    const dueDate = ca.due_date as string;
    const daysOverdue = Math.abs(
      Math.round(
        (new Date(dueDate).getTime() - new Date(today).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

    const item: OverdueACItem = {
      acDescription: (ca.description as string) ?? "Azione correttiva",
      ncTitle: (nc?.title as string) ?? "Non conformità",
      clientName: (client?.name as string) ?? "—",
      dueDate,
      daysOverdue,
      responsibleName: (ca.responsible_person_name as string) ?? email,
    };

    const { subject, html } = buildOverdueACEmail(item);

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject,
        html,
      });
      sent++;
    } catch {
      skipped++;
    }
  }

  if (items.length === 0) {
    return { success: false, error: "Nessuna AC scaduta con email destinatario." };
  }

  return { success: true, sent, skipped };
}
