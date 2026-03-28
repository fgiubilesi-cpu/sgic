import { describe, expect, it } from "vitest";

import { buildPersonnelMutationPayload } from "@/features/personnel/lib/personnel-action-payloads";
import { personnelSchema } from "@/features/personnel/schemas/personnel-schema";

describe("personnel-action-payloads", () => {
  it("normalizes optional personnel fields while keeping org scope", () => {
    const validated = personnelSchema.parse({
      client_id: "550e8400-e29b-41d4-a716-446655440000",
      email: " ops@example.com ",
      first_name: "Luca",
      hire_date: " ",
      is_active: true,
      last_name: "Rossi",
      location_id: "none",
      role: "QA",
      tax_code: " ",
    });

    expect(
      buildPersonnelMutationPayload({
        locationId: null,
        organizationId: "org-1",
        validated,
      })
    ).toEqual({
      client_id: "550e8400-e29b-41d4-a716-446655440000",
      email: "ops@example.com",
      first_name: "Luca",
      hire_date: null,
      is_active: true,
      last_name: "Rossi",
      location_id: null,
      organization_id: "org-1",
      role: "QA",
      tax_code: null,
    });
  });
});
