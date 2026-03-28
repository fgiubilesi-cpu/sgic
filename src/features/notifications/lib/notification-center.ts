import type { OrganizationNotificationsConfig } from "@/features/organization/lib/organization-console-config";

export type NotificationSeverity = "default" | "warning" | "danger";
export type NotificationSendAction = "deadlines_summary" | "overdue_corrective_actions" | null;

export type NotificationSignalKey =
  | "audit_overdue"
  | "audit_upcoming"
  | "document_expiry"
  | "open_non_conformities"
  | "overdue_actions"
  | "training_expiry";

export type NotificationDispatchStatus = "failed" | "sent" | "skipped" | "suppressed";

export interface NotificationSignal {
  count: number;
  description: string;
  enabled: boolean;
  href: string;
  key: NotificationSignalKey;
  label: string;
  sendAction: NotificationSendAction;
  severity: NotificationSeverity;
}

export interface NotificationDispatchRecord {
  audience: "admins" | "admins_inspectors";
  channel: "dashboard" | "email";
  createdAt: string;
  details: string | null;
  id: string;
  recipient: string | null;
  severity: NotificationSeverity;
  status: NotificationDispatchStatus;
  title: string;
  type: string;
}

export interface NotificationCenterItem extends NotificationSignal {
  reason?: string;
  status: "active" | "silenced";
}

export interface NotificationCenterModel {
  active: NotificationCenterItem[];
  preferences: {
    audience: OrganizationNotificationsConfig["audience"];
    deliveryChannel: OrganizationNotificationsConfig["deliveryChannel"];
    digestFrequency: OrganizationNotificationsConfig["digestFrequency"];
    minimumSeverity: OrganizationNotificationsConfig["minimumSeverity"];
    recipientsCount: number;
  };
  recent: NotificationDispatchRecord[];
  silenced: NotificationCenterItem[];
  summary: {
    active: number;
    pendingCount: number;
    recentSent: number;
    silenced: number;
  };
}

const severityRank: Record<NotificationSeverity, number> = {
  default: 0,
  warning: 1,
  danger: 2,
};

function countRecipients(recipients: string) {
  return recipients
    .split(",")
    .map((recipient) => recipient.trim())
    .filter(Boolean).length;
}

function sortItems(items: NotificationCenterItem[]) {
  return [...items].sort((left, right) => {
    if (severityRank[left.severity] !== severityRank[right.severity]) {
      return severityRank[right.severity] - severityRank[left.severity];
    }

    if (left.count !== right.count) {
      return right.count - left.count;
    }

    return left.label.localeCompare(right.label, "it");
  });
}

export function buildNotificationCenterModel(input: {
  config: OrganizationNotificationsConfig;
  dispatches: NotificationDispatchRecord[];
  signals: NotificationSignal[];
}): NotificationCenterModel {
  const active: NotificationCenterItem[] = [];
  const silenced: NotificationCenterItem[] = [];

  for (const signal of input.signals) {
    if (signal.count <= 0) {
      continue;
    }

    if (!signal.enabled) {
      silenced.push({
        ...signal,
        reason: "Trigger disattivato dalla policy tenant.",
        status: "silenced",
      });
      continue;
    }

    if (
      severityRank[signal.severity] <
      severityRank[input.config.minimumSeverity]
    ) {
      silenced.push({
        ...signal,
        reason: "Segnale sotto la soglia minima di severita impostata.",
        status: "silenced",
      });
      continue;
    }

    active.push({
      ...signal,
      status: "active",
    });
  }

  const recent = [...input.dispatches].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

  return {
    active: sortItems(active),
    preferences: {
      audience: input.config.audience,
      deliveryChannel: input.config.deliveryChannel,
      digestFrequency: input.config.digestFrequency,
      minimumSeverity: input.config.minimumSeverity,
      recipientsCount: countRecipients(input.config.recipients),
    },
    recent,
    silenced: sortItems(silenced),
    summary: {
      active: active.length,
      pendingCount: active.reduce((total, item) => total + item.count, 0),
      recentSent: recent.filter((dispatch) => dispatch.status === "sent").length,
      silenced: silenced.length,
    },
  };
}
