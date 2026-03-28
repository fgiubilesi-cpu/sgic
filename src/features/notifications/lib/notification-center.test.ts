import { describe, expect, it } from "vitest";

import {
  buildNotificationCenterModel,
  type NotificationDispatchRecord,
  type NotificationSignal,
} from "@/features/notifications/lib/notification-center";
import { getDefaultOrganizationConsoleConfig } from "@/features/organization/lib/organization-console-config";

function createSignal(overrides: Partial<NotificationSignal>): NotificationSignal {
  return {
    count: 1,
    description: "Descrizione",
    enabled: true,
    href: "/documents",
    key: "document_expiry",
    label: "Documenti in scadenza",
    sendAction: "deadlines_summary",
    severity: "warning",
    ...overrides,
  };
}

function createDispatch(overrides: Partial<NotificationDispatchRecord>): NotificationDispatchRecord {
  return {
    audience: "admins_inspectors",
    channel: "email",
    createdAt: "2026-03-28T09:00:00.000Z",
    details: null,
    id: "dispatch-1",
    recipient: "ops@example.com",
    severity: "warning",
    status: "sent",
    title: "Riepilogo scadenze",
    type: "deadlines_summary",
    ...overrides,
  };
}

describe("notification-center", () => {
  it("keeps enabled signals above threshold in the active queue", () => {
    const config = getDefaultOrganizationConsoleConfig().notifications;

    const model = buildNotificationCenterModel({
      config,
      dispatches: [createDispatch({ createdAt: "2026-03-28T10:00:00.000Z" })],
      signals: [createSignal({ count: 3 })],
    });

    expect(model.active).toHaveLength(1);
    expect(model.silenced).toHaveLength(0);
    expect(model.summary.pendingCount).toBe(3);
    expect(model.summary.recentSent).toBe(1);
  });

  it("moves low-severity signals to silenced when the tenant threshold is stricter", () => {
    const config = getDefaultOrganizationConsoleConfig().notifications;
    config.minimumSeverity = "danger";

    const model = buildNotificationCenterModel({
      config,
      dispatches: [],
      signals: [createSignal({ key: "audit_upcoming", label: "Audit in agenda", sendAction: null, severity: "default" })],
    });

    expect(model.active).toHaveLength(0);
    expect(model.silenced).toHaveLength(1);
    expect(model.silenced[0]?.reason).toContain("soglia");
  });

  it("surfaces disabled signals as silenced when pressure exists", () => {
    const config = getDefaultOrganizationConsoleConfig().notifications;

    const model = buildNotificationCenterModel({
      config,
      dispatches: [],
      signals: [createSignal({ count: 5, enabled: false, key: "overdue_actions", label: "Azioni correttive scadute", sendAction: "overdue_corrective_actions", severity: "danger" })],
    });

    expect(model.active).toHaveLength(0);
    expect(model.silenced).toHaveLength(1);
    expect(model.silenced[0]?.reason).toContain("disattivato");
  });
});
