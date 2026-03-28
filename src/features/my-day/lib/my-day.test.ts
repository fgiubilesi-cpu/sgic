import { describe, expect, it } from "vitest";

import {
  buildMyDayAgenda,
  type ReviewDocumentSignal,
} from "@/features/my-day/lib/my-day";
import type {
  DailyExecutionItem,
  DailyExecutionOverview,
} from "@/features/clients/queries/get-daily-execution-overview";
import type { UnifiedDeadline } from "@/features/deadlines/queries/get-unified-deadlines";

function createExecutionItem(
  overrides: Partial<DailyExecutionItem> = {}
): DailyExecutionItem {
  return {
    client_id: "client-1",
    client_name: "Hotel Aurora",
    critical_reasons: [],
    critical_score: 0,
    due_date: null,
    has_service_link: true,
    href: "/clients/client-1",
    id: "task-1",
    is_recurring: false,
    kind: "task",
    location_id: null,
    location_name: null,
    owner_name: null,
    priority: "medium",
    recurrence_label: null,
    source_label: "Task",
    status_label: "Aperta",
    title: "Verifica attività",
    ...overrides,
  };
}

function createDeadline(
  overrides: Partial<UnifiedDeadline> = {}
): UnifiedDeadline {
  return {
    clientName: "Hotel Aurora",
    daysUntil: 0,
    description: "Scadenza documento",
    dueDate: "2026-03-30",
    href: "/documents/doc-1",
    id: "document-1",
    title: "DVR",
    type: "document",
    urgency: "warning30",
    ...overrides,
  };
}

function createReviewDocument(
  overrides: Partial<ReviewDocumentSignal> = {}
): ReviewDocumentSignal {
  return {
    clientName: "Hotel Aurora",
    href: "/documents/doc-1",
    id: "doc-1",
    ingestionStatus: "review_required",
    locationName: "Cucina",
    personnelName: null,
    title: "Manuale HACCP",
    updatedAt: "2026-03-30T08:00:00Z",
    ...overrides,
  };
}

describe("my-day", () => {
  it("builds agenda sections from execution, deadlines and review documents", () => {
    const dailyExecutionOverview: DailyExecutionOverview = {
      blockedItems: [
        createExecutionItem({
          critical_reasons: ["Attività bloccata"],
          critical_score: 6,
          id: "blocked-1",
          priority: "high",
          status_label: "Bloccata",
          title: "Riallineare piano audit",
        }),
      ],
      criticalItems: [],
      overdueItems: [
        createExecutionItem({
          critical_reasons: ["Oltre termine"],
          critical_score: 8,
          due_date: "2026-03-29",
          id: "overdue-1",
          priority: "critical",
          title: "Chiudere task scaduto",
        }),
      ],
      recurringItems: [],
      summary: {
        blocked: 1,
        critical: 3,
        overdue: 1,
        recurring: 0,
        this_week: 2,
        today: 1,
      },
      thisWeekItems: [
        createExecutionItem({
          due_date: "2026-03-30",
          id: "today-1",
          title: "Preparare checklist giornaliera",
        }),
        createExecutionItem({
          due_date: "2026-04-01",
          id: "week-1",
          title: "Confermare audit di venerdì",
        }),
      ],
      todayItems: [
        createExecutionItem({
          due_date: "2026-03-30",
          id: "today-1",
          title: "Preparare checklist giornaliera",
        }),
      ],
    };

    const agenda = buildMyDayAgenda({
      dailyExecutionOverview,
      deadlines: [
        createDeadline({
          daysUntil: -2,
          dueDate: "2026-03-28",
          id: "deadline-overdue",
          title: "Corso in scadenza",
          type: "training",
          urgency: "overdue",
        }),
        createDeadline({
          daysUntil: 0,
          dueDate: "2026-03-30",
          id: "deadline-today",
          title: "Audit produzione",
          type: "audit",
          urgency: "warning30",
        }),
        createDeadline({
          daysUntil: 2,
          dueDate: "2026-04-01",
          id: "deadline-week",
          title: "Visita medica",
          type: "medical",
          urgency: "warning30",
        }),
      ],
      reviewDocuments: [
        createReviewDocument(),
        createReviewDocument({
          id: "doc-2",
          ingestionStatus: "failed",
          title: "Certificato laboratorio",
        }),
      ],
      today: new Date("2026-03-30T10:00:00Z"),
    });

    expect(agenda.summary).toEqual({
      blocked: 1,
      critical: 3,
      overdue: 2,
      review: 2,
      thisWeek: 2,
      today: 2,
    });
    expect(agenda.sections.overdue.map((item) => item.title)).toEqual([
      "Corso in scadenza",
      "Chiudere task scaduto",
    ]);
    expect(agenda.sections.today.map((item) => item.title)).toEqual([
      "Audit produzione",
      "Preparare checklist giornaliera",
    ]);
    expect(agenda.sections.this_week.map((item) => item.title)).toEqual([
      "Visita medica",
      "Confermare audit di venerdì",
    ]);
    expect(agenda.sections.review[0]).toMatchObject({
      badge: "Import fallito",
      priority: "urgent",
      title: "Certificato laboratorio",
    });
  });
});
