import { describe, expect, it } from "vitest";

import { buildAuditHistorySummary } from "@/features/audits/lib/audit-history-view";

describe("audit-history-view", () => {
  it("summarizes totals, progress and average compliance", () => {
    expect(
      buildAuditHistorySummary([
        { score: 80, status: "Closed" },
        { score: 90, status: "Closed" },
        { score: null, status: "In Progress" },
      ])
    ).toEqual({
      averageCompliance: 85,
      closedAudits: 2,
      inProgressAudits: 1,
      totalAudits: 3,
    });
  });
});
