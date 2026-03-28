import { describe, expect, it } from "vitest";

import {
  buildClientDeadlineMutationPayload,
  buildClientTaskMutationPayload,
  buildClientTaskStatusPatch,
} from "@/features/clients/lib/client-workspace-action-payloads";
import {
  clientDeadlineSchema,
  clientTaskSchema,
} from "@/features/clients/schemas/client-workspace-schema";

describe("client-workspace-action-payloads", () => {
  it("builds task payloads with normalized optional fields and completion stamp", () => {
    const validated = clientTaskSchema.parse({
      audit_id: "",
      description: " ",
      due_date: " ",
      is_recurring: false,
      location_id: "",
      owner_name: " Mario ",
      priority: "high",
      recurrence_label: " ",
      service_line_id: "",
      status: "done",
      title: "Task demo",
    });

    expect(
      buildClientTaskMutationPayload({
        auditId: null,
        clientId: "client-1",
        locationId: null,
        now: "2026-03-28T10:00:00.000Z",
        organizationId: "org-1",
        serviceLineId: null,
        validated,
      })
    ).toMatchObject({
      client_id: "client-1",
      completed_at: "2026-03-28T10:00:00.000Z",
      description: null,
      due_date: null,
      organization_id: "org-1",
      owner_name: "Mario",
      status: "done",
      title: "Task demo",
    });
  });

  it("builds status patches and manual deadline payloads coherently", () => {
    expect(buildClientTaskStatusPatch("open", "2026-03-28T10:00:00.000Z")).toEqual({
      completed_at: null,
      status: "open",
    });

    const validated = clientDeadlineSchema.parse({
      description: " ",
      due_date: "2026-04-20",
      location_id: "",
      priority: "critical",
      service_line_id: "",
      status: "open",
      title: "Scadenza demo",
    });

    expect(
      buildClientDeadlineMutationPayload({
        clientId: "client-1",
        createdBy: "user-1",
        locationId: null,
        organizationId: "org-1",
        serviceLineId: null,
        validated,
      })
    ).toMatchObject({
      client_id: "client-1",
      created_by: "user-1",
      description: null,
      due_date: "2026-04-20",
      organization_id: "org-1",
      priority: "critical",
      source_type: "manual",
      status: "open",
      title: "Scadenza demo",
    });
  });
});
