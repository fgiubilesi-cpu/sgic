import { describe, expect, it } from "vitest";

import {
  normalizeCorrectiveActionDateFields,
  toCanonicalCorrectiveAction,
  toCanonicalNonConformity,
} from "./nc-ac-contract";

describe("nc-ac-contract", () => {
  it("normalizes date fields to a single canonical deadline", () => {
    expect(
      normalizeCorrectiveActionDateFields({
        targetCompletionDate: "2026-04-10",
      })
    ).toEqual({
      due_date: "2026-04-10",
      target_completion_date: "2026-04-10",
    });
  });

  it("maps snake_case corrective actions to canonical shape", () => {
    expect(
      toCanonicalCorrectiveAction({
        description: "Chiudere il gap",
        due_date: "2026-04-02",
        id: "ca-1",
        non_conformity_id: "nc-1",
        status: "in_progress",
      })
    ).toMatchObject({
      dueDate: "2026-04-02",
      nonConformityId: "nc-1",
      status: "in_progress",
      targetCompletionDate: "2026-04-02",
    });
  });

  it("maps audit query shapes to canonical shape", () => {
    const canonical = toCanonicalNonConformity({
      auditId: "audit-1",
      checklistItem: {
        outcome: "non_conforme",
        question: "La procedura e disponibile?",
      },
      checklistItemId: "item-1",
      correctiveActions: [
        {
          description: "Aggiornare procedura",
          id: "ca-2",
          nonConformityId: "nc-2",
          status: "pending",
          targetCompletionDate: "2026-04-20",
        },
      ],
      createdAt: "2026-03-27T09:00:00.000Z",
      description: "Procedura non aggiornata",
      id: "nc-2",
      severity: "critical",
      status: "open",
      title: "Procedura obsoleta",
      updatedAt: "2026-03-27T09:00:00.000Z",
    });

    expect(canonical).toMatchObject({
      auditId: "audit-1",
      checklistItemId: "item-1",
      checklistQuestion: "La procedura e disponibile?",
      severity: "critical",
      status: "open",
      title: "Procedura obsoleta",
    });
    expect(canonical.correctiveActions[0]).toMatchObject({
      dueDate: "2026-04-20",
      targetCompletionDate: "2026-04-20",
    });
  });
});
