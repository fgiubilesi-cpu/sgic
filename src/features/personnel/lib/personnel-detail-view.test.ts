import { describe, expect, it } from "vitest";

import { buildPersonnelSeed } from "@/features/personnel/lib/personnel-detail-view";
import type { PersonnelDetail } from "@/features/personnel/actions/personnel-actions";

describe("personnel-detail-view", () => {
  it("builds the single-person seed used by training registration", () => {
    const person = {
      client_id: "client-1",
      client_name: "Cliente Demo",
      email: "ops@example.com",
      first_name: "Luca",
      hire_date: "2026-03-01",
      id: "person-1",
      is_active: true,
      last_name: "Rossi",
      location_id: "location-1",
      location_name: "Sede Demo",
      next_expiry_date: null,
      operational_status: "ok",
      organization_id: "org-1",
      role: "QA",
      tax_code: "RSSLCU00A01H501U",
      timeline: [],
      training_expired_count: 0,
      training_expiring_count: 0,
      training_records: [],
    } as unknown as PersonnelDetail;

    expect(buildPersonnelSeed(person)[0]).toMatchObject({
      client_id: "client-1",
      email: "ops@example.com",
      first_name: "Luca",
      id: "person-1",
      organization_id: "org-1",
    });
  });
});
