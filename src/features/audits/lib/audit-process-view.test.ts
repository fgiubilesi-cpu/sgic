import { describe, expect, it } from "vitest";

import {
  getCorrectiveActionOperationalFocus,
  sortCorrectiveActionsForAudit,
} from "./audit-process-view";

const buildAction = (overrides: Partial<{
  completedAt: string | null;
  createdAt: string;
  description: string;
  dueDate: string | null;
  id: string;
  nonConformityId: string;
  responsiblePersonEmail: string | null;
  responsiblePersonName: string | null;
  rootCause: string | null;
  actionPlan: string | null;
  status: "pending" | "in_progress" | "completed";
  targetCompletionDate: string | null;
  updatedAt: string;
}> = {}) => ({
  id: overrides.id ?? "ca-1",
  nonConformityId: overrides.nonConformityId ?? "nc-1",
  description: overrides.description ?? "Aggiornare procedura di sanificazione",
  rootCause: overrides.rootCause ?? null,
  actionPlan: overrides.actionPlan ?? null,
  responsiblePersonName:
    overrides.responsiblePersonName === undefined
      ? "Mario Rossi"
      : overrides.responsiblePersonName,
  responsiblePersonEmail: overrides.responsiblePersonEmail ?? null,
  dueDate: overrides.dueDate === undefined ? "2026-03-30" : overrides.dueDate,
  targetCompletionDate:
    overrides.targetCompletionDate === undefined
      ? overrides.dueDate === undefined
        ? "2026-03-30"
        : overrides.dueDate
      : overrides.targetCompletionDate,
  status: overrides.status ?? "pending",
  createdAt: overrides.createdAt ?? "2026-03-10T10:00:00.000Z",
  updatedAt: overrides.updatedAt ?? "2026-03-10T10:00:00.000Z",
  completedAt: overrides.completedAt ?? null,
});

describe("audit-process-view", () => {
  it("highlights overdue corrective actions as urgent", () => {
    const focus = getCorrectiveActionOperationalFocus(
      buildAction({
        dueDate: "2026-03-15",
        status: "in_progress",
        targetCompletionDate: "2026-03-15",
      }),
      new Date("2026-03-20T09:00:00.000Z")
    );

    expect(focus).toEqual({
      label: "Scadenza superata",
      detail: "Da chiudere dal 15 mar 2026.",
      tone: "critical",
    });
  });

  it("flags incomplete handoff when owner and deadline are missing", () => {
    const focus = getCorrectiveActionOperationalFocus(
      buildAction({
        dueDate: null,
        responsiblePersonName: null,
        targetCompletionDate: null,
      })
    );

    expect(focus).toEqual({
      label: "Presa in carico incompleta",
      detail: "Mancano responsabile e data obiettivo.",
      tone: "warning",
    });
  });

  it("summarizes completed corrective actions with closure date", () => {
    const focus = getCorrectiveActionOperationalFocus(
      buildAction({
        completedAt: "2026-03-18T15:00:00.000Z",
        status: "completed",
      })
    );

    expect(focus).toEqual({
      label: "Completata",
      detail: "Chiusa il 18 mar 2026.",
      tone: "success",
    });
  });

  it("sorts audit actions by operational pressure before chronology", () => {
    const ordered = sortCorrectiveActionsForAudit(
      [
        buildAction({
          createdAt: "2026-03-12T10:00:00.000Z",
          dueDate: null,
          id: "missing-deadline",
          status: "pending",
          targetCompletionDate: null,
        }),
        buildAction({
          completedAt: "2026-03-13T10:00:00.000Z",
          id: "completed",
          status: "completed",
        }),
        buildAction({
          dueDate: "2026-03-14",
          id: "overdue",
          status: "in_progress",
          targetCompletionDate: "2026-03-14",
        }),
        buildAction({
          dueDate: "2026-03-22",
          id: "scheduled",
          status: "pending",
          targetCompletionDate: "2026-03-22",
        }),
      ],
      new Date("2026-03-20T09:00:00.000Z")
    );

    expect(ordered.map((action) => action.id)).toEqual([
      "overdue",
      "scheduled",
      "missing-deadline",
      "completed",
    ]);
  });
});
