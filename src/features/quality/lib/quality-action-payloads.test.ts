import { describe, expect, it } from "vitest";

import {
  buildCorrectiveActionInsertPayload,
  buildCorrectiveActionUpdatePayload,
  buildNonConformityInsertPayload,
  buildNonConformityUpdatePayload,
} from "@/features/quality/lib/quality-action-payloads";
import {
  correctiveActionSchema,
  nonConformitySchema,
} from "@/features/quality/schemas/nc-ac.schema";

describe("quality-action-payloads", () => {
  it("builds NC insert payloads with organization scope", () => {
    const validated = nonConformitySchema.parse({
      description: "Descrizione",
      identified_date: "2026-03-28",
      severity: "major",
      status: "open",
      title: "NC demo",
    });

    expect(buildNonConformityInsertPayload(validated, "org-1")).toEqual({
      description: "Descrizione",
      identified_date: "2026-03-28",
      organization_id: "org-1",
      severity: "major",
      status: "open",
      title: "NC demo",
    });
  });

  it("updates NC closed_at only when status is closed", () => {
    const now = "2026-03-28T10:00:00.000Z";

    expect(
      buildNonConformityUpdatePayload({ status: "closed" }, now).closed_at
    ).toBe(now);
    expect(
      buildNonConformityUpdatePayload({ status: "open" }, now).closed_at
    ).toBeNull();
  });

  it("normalizes corrective action dates on insert and update", () => {
    const validated = correctiveActionSchema.parse({
      description: "AC demo",
      due_date: "2026-04-10",
      non_conformity_id: "550e8400-e29b-41d4-a716-446655440000",
      status: "pending",
    });

    expect(buildCorrectiveActionInsertPayload(validated, "org-1")).toMatchObject({
      due_date: "2026-04-10",
      non_conformity_id: "550e8400-e29b-41d4-a716-446655440000",
      organization_id: "org-1",
      target_completion_date: "2026-04-10",
    });

    expect(
      buildCorrectiveActionUpdatePayload({ due_date: "2026-05-01" }, "2026-03-28T10:00:00.000Z")
    ).toMatchObject({
      due_date: "2026-05-01",
      target_completion_date: "2026-05-01",
      updated_at: "2026-03-28T10:00:00.000Z",
    });
  });
});
