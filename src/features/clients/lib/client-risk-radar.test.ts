import { describe, expect, it } from "vitest";

import { buildClientRiskRadar } from "@/features/clients/lib/client-risk-radar";

describe("client-risk-radar", () => {
  it("returns a stable radar when no pressure signals are present", () => {
    const radar = buildClientRiskRadar({});

    expect(radar).toMatchObject({
      label: "Stabile",
      level: "stable",
      score: 0,
    });
    expect(radar.drivers).toEqual([]);
  });

  it("surfaces critical drivers with an explainable score", () => {
    const radar = buildClientRiskRadar({
      averageAuditScore: 64,
      criticalNcCount: 1,
      openNcCount: 4,
      overdueActionCount: 2,
      overdueDocumentCount: 1,
      overdueTaskCount: 2,
      reviewQueueCount: 3,
      scoreDelta: -12,
      upcomingAuditCount: 1,
    });

    expect(radar.level).toBe("critical");
    expect(radar.score).toBeGreaterThanOrEqual(60);
    expect(radar.drivers.map((driver) => driver.label)).toContain("1 NC critiche");
    expect(radar.drivers.map((driver) => driver.label)).toContain("2 AC scadute");
    expect(radar.summary).toContain("NC critiche");
  });
});
