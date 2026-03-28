import {
  addDays,
  getStartOfToday,
} from "@/features/dashboard/lib/dashboard-data-utils";
import {
  buildNotificationCenterModel,
  type NotificationCenterModel,
  type NotificationDispatchRecord,
  type NotificationSeverity,
  type NotificationSignal,
} from "@/features/notifications/lib/notification-center";
import { parseOrganizationConsoleConfig } from "@/features/organization/lib/organization-console-config";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import type { Json } from "@/types/database.types";

function isRecord(value: Json | null): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toSeverity(value: Json | undefined): NotificationSeverity {
  if (value === "danger" || value === "warning") {
    return value;
  }

  return "default";
}

function parseDispatchRecord(row: {
  created_at: string | null;
  id: string;
  new_data: Json | null;
}): NotificationDispatchRecord | null {
  if (!isRecord(row.new_data)) {
    return null;
  }

  const createdAt =
    typeof row.new_data.sent_at === "string"
      ? row.new_data.sent_at
      : row.created_at ?? new Date().toISOString();
  const status =
    row.new_data.status === "failed" ||
    row.new_data.status === "sent" ||
    row.new_data.status === "skipped" ||
    row.new_data.status === "suppressed"
      ? row.new_data.status
      : "sent";

  return {
    audience:
      row.new_data.audience === "admins"
        ? "admins"
        : "admins_inspectors",
    channel: row.new_data.channel === "dashboard" ? "dashboard" : "email",
    createdAt,
    details:
      typeof row.new_data.details === "string" ? row.new_data.details : null,
    id: row.id,
    recipient:
      typeof row.new_data.recipient === "string"
        ? row.new_data.recipient
        : null,
    severity: toSeverity(row.new_data.severity),
    status,
    title:
      typeof row.new_data.title === "string"
        ? row.new_data.title
        : "Notifica",
    type:
      typeof row.new_data.type === "string"
        ? row.new_data.type
        : "notification",
  };
}

export async function getNotificationCenter(): Promise<NotificationCenterModel | null> {
  const ctx = await getOrganizationContext();
  if (!ctx || ctx.role === "client") {
    return null;
  }

  const { data: organization, error: organizationError } = await ctx.supabase
    .from("organizations")
    .select("settings")
    .eq("id", ctx.organizationId)
    .single();

  if (organizationError || !organization) {
    return null;
  }

  const consoleConfig = parseOrganizationConsoleConfig(organization.settings);
  const config = consoleConfig.notifications;
  const today = getStartOfToday();
  const auditCutoff = addDays(today, consoleConfig.rules.auditAlertDays);
  const documentCutoff = addDays(today, consoleConfig.rules.documentAlertDays);
  const trainingCutoff = addDays(today, consoleConfig.rules.trainingAlertDays);
  const activeAuditStatuses = ["Scheduled", "In Progress", "Review"];
  const prioritySeverities = ["critical", "major"];
  const visibleDispatchesAudience =
    config.audience === "admins" && ctx.role !== "admin"
      ? "admins"
      : config.audience;

  const [
    { count: overdueAuditsCount },
    { count: upcomingAuditsCount },
    { count: priorityNcCount },
    { count: overdueActionsCount },
    { count: overdueDocumentsCount },
    { count: expiringDocumentsCount },
    { count: expiredTrainingCount },
    { count: expiringTrainingCount },
    { data: dispatchRows },
  ] = await Promise.all([
    ctx.supabase
      .from("audits")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .in("status", activeAuditStatuses)
      .lt("scheduled_date", today.toISOString().slice(0, 10)),
    ctx.supabase
      .from("audits")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .in("status", activeAuditStatuses)
      .gte("scheduled_date", today.toISOString().slice(0, 10))
      .lte("scheduled_date", auditCutoff.toISOString().slice(0, 10)),
    ctx.supabase
      .from("non_conformities")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .eq("status", "open")
      .in("severity", prioritySeverities),
    ctx.supabase
      .from("corrective_actions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .is("deleted_at", null)
      .neq("status", "completed")
      .not("target_completion_date", "is", null)
      .lt("target_completion_date", today.toISOString().slice(0, 10)),
    ctx.supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .not("expiry_date", "is", null)
      .lt("expiry_date", today.toISOString().slice(0, 10)),
    ctx.supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .not("expiry_date", "is", null)
      .gte("expiry_date", today.toISOString().slice(0, 10))
      .lte("expiry_date", documentCutoff.toISOString().slice(0, 10)),
    ctx.supabase
      .from("training_records")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .not("expiry_date", "is", null)
      .lt("expiry_date", today.toISOString().slice(0, 10)),
    ctx.supabase
      .from("training_records")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.organizationId)
      .not("expiry_date", "is", null)
      .gte("expiry_date", today.toISOString().slice(0, 10))
      .lte("expiry_date", trainingCutoff.toISOString().slice(0, 10)),
    ctx.supabase
      .from("audit_logs")
      .select("id, created_at, new_data")
      .eq("organization_id", ctx.organizationId)
      .eq("table_name", "notification_dispatches")
      .eq("action", "INSERT")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const signals: NotificationSignal[] = [
    {
      count: overdueAuditsCount ?? 0,
      description: "Audit oltre data attesa che richiedono riallineamento immediato.",
      enabled: config.sendAuditOverdue,
      href: "/audits",
      key: "audit_overdue",
      label: "Audit overdue",
      sendAction: null,
      severity: "danger",
    },
    {
      count: upcomingAuditsCount ?? 0,
      description: "Audit in finestra di preparazione, da confermare con checklist e logistica.",
      enabled: config.sendAuditUpcoming,
      href: "/audits",
      key: "audit_upcoming",
      label: "Audit upcoming",
      sendAction: null,
      severity: "default",
    },
    {
      count: priorityNcCount ?? 0,
      description: "NC critiche o maggiori ancora aperte nel perimetro attivo.",
      enabled: config.sendOpenNonConformities,
      href: "/non-conformities",
      key: "open_non_conformities",
      label: "NC prioritarie",
      sendAction: null,
      severity: "warning",
    },
    {
      count: overdueActionsCount ?? 0,
      description: "Azioni correttive oltre target date, con invio notifiche manuale disponibile.",
      enabled: config.sendOverdueActions,
      href: "/non-conformities",
      key: "overdue_actions",
      label: "Azioni correttive scadute",
      sendAction: "overdue_corrective_actions",
      severity: "danger",
    },
    {
      count:
        overdueDocumentsCount && overdueDocumentsCount > 0
          ? overdueDocumentsCount
          : expiringDocumentsCount ?? 0,
      description:
        overdueDocumentsCount && overdueDocumentsCount > 0
          ? "Documenti gia scaduti nel tenant."
          : "Documenti in scadenza nella finestra di presidio.",
      enabled: config.sendDocumentExpiry,
      href: "/documents",
      key: "document_expiry",
      label: "Documenti in scadenza",
      sendAction: "deadlines_summary",
      severity:
        overdueDocumentsCount && overdueDocumentsCount > 0
          ? "danger"
          : "warning",
    },
    {
      count:
        expiredTrainingCount && expiredTrainingCount > 0
          ? expiredTrainingCount
          : expiringTrainingCount ?? 0,
      description:
        expiredTrainingCount && expiredTrainingCount > 0
          ? "Corsi o visite gia scaduti e da riallineare."
          : "Formazione e visite vicine alla scadenza.",
      enabled: config.sendTrainingExpiry,
      href: "/training",
      key: "training_expiry",
      label: "Formazione in scadenza",
      sendAction: null,
      severity:
        expiredTrainingCount && expiredTrainingCount > 0
          ? "danger"
          : "warning",
    },
  ];

  const dispatches = (dispatchRows ?? [])
    .map(parseDispatchRecord)
    .filter(
      (dispatch): dispatch is NotificationDispatchRecord =>
        dispatch !== null &&
        (visibleDispatchesAudience === "admins_inspectors" ||
          dispatch.audience === "admins")
    );

  return buildNotificationCenterModel({
    config,
    dispatches,
    signals,
  });
}
