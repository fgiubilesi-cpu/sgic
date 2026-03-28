import { describe, expect, it } from "vitest";

import { buildDashboardActionCenter } from "@/features/dashboard/lib/dashboard-action-center";
import { getStartOfToday } from "@/features/dashboard/lib/dashboard-data-utils";

const config = {
  notifications: {
    sendAuditUpcoming: true,
    sendDocumentExpiry: true,
    sendOpenNonConformities: true,
    sendOverdueActions: true,
    sendTrainingExpiry: true,
  },
  rules: {
    auditAlertDays: 7,
    documentAlertDays: 30,
    trainingAlertDays: 30,
  },
};

describe("dashboard-action-center", () => {
  it("builds prioritized notifications and todos from overdue and expiring work", () => {
    const today = getStartOfToday(new Date("2026-03-26T12:00:00Z"));
    const actionCenter = buildDashboardActionCenter({
      auditRows: [
        {
          id: "audit-1",
          title: "Audit cucina",
          scheduled_date: "2026-03-20",
          status: "Scheduled",
          client_id: "client-1",
          location_id: "loc-1",
          client: { name: "Hotel Aurora" },
          location: { name: "Cucina" },
        },
        {
          id: "audit-2",
          title: "Audit sala",
          scheduled_date: "2026-03-28",
          status: "Scheduled",
          client_id: "client-1",
          location_id: "loc-2",
          client: { name: "Hotel Aurora" },
          location: { name: "Sala" },
        },
      ],
      config,
      correctiveActionRows: [
        {
          id: "ac-1",
          non_conformity_id: "nc-1",
          responsible_person_name: "Mario",
          status: "pending",
          target_completion_date: "2026-03-15",
        },
      ],
      documentRows: [
        {
          id: "doc-1",
          title: "DVR",
          expiry_date: "2026-03-18",
          status: "valid",
          client_id: "client-1",
          location_id: null,
          personnel_id: null,
        },
      ],
      openNcRows: [
        {
          id: "nc-1",
          title: "Temperatura fuori range",
          severity: "critical",
          status: "open",
          audit_id: "audit-1",
        },
      ],
      personnelRows: [
        {
          id: "person-1",
          first_name: "Luca",
          last_name: "Verdi",
          is_active: true,
          client_id: "client-1",
          location_id: null,
        },
      ],
      today,
      trainingRecordRows: [
        {
          id: "tr-1",
          personnel_id: "person-1",
          expiry_date: "2026-03-19",
          completion_date: "2025-03-19",
          course: { title: "HACCP base" },
        },
      ],
    });

    expect(actionCenter.notifications.map((item) => item.id)).toEqual([
      "overdue-corrective-actions",
      "critical-ncs",
      "document-deadlines",
      "training-deadlines",
    ]);
    expect(actionCenter.todos.map((item) => item.id)).toEqual([
      "audit-audit-1",
      "ac-ac-1",
      "document-doc-1",
      "training-tr-1",
    ]);
    expect(actionCenter.todos[0]).toMatchObject({
      priority: "urgent",
      badge: "Audit scaduto",
    });
  });

  it("falls back to upcoming audits when no urgent items exist", () => {
    const today = getStartOfToday(new Date("2026-03-26T12:00:00Z"));
    const actionCenter = buildDashboardActionCenter({
      auditRows: [
        {
          id: "audit-2",
          title: "Audit sala",
          scheduled_date: "2026-03-28",
          status: "Scheduled",
          client_id: "client-1",
          location_id: "loc-2",
          client: { name: "Hotel Aurora" },
          location: { name: "Sala" },
        },
      ],
      config,
      correctiveActionRows: [],
      documentRows: [],
      openNcRows: [],
      personnelRows: [],
      today,
      trainingRecordRows: [],
    });

    expect(actionCenter.notifications).toEqual([
      {
        id: "upcoming-audits",
        title: "1 audit nei prossimi 7 giorni",
        description:
          "Conviene confermare disponibilita, sede e checklist operative prima della settimana.",
        href: "/audits",
        tone: "default",
      },
    ]);
    expect(actionCenter.todos).toEqual([
      expect.objectContaining({
        id: "upcoming-audit-audit-2",
        badge: "Prossimo audit",
        priority: "normal",
      }),
    ]);
  });
});
