import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildPersonnelTimeline,
  getOperationalStatusMeta,
  getPersonnelOperationalStatus,
  getTrainingWindowSummary,
} from "@/features/personnel/lib/personnel-status";

describe("personnel-status", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("summarizes expired, expiring, and valid training windows", () => {
    const summary = getTrainingWindowSummary(
      [
        { completion_date: "2025-03-01", expiry_date: "2026-03-10" },
        { completion_date: "2026-01-10", expiry_date: "2026-04-10" },
        { completion_date: "2026-03-01", expiry_date: null },
      ],
      30
    );

    expect(summary).toEqual({
      expiredCount: 1,
      expiringSoonCount: 1,
      nextExpiryDate: "2026-03-10",
      totalCount: 3,
      validCount: 2,
    });
  });

  it("derives operational state and metadata from the training summary", () => {
    const expiredSummary = getTrainingWindowSummary([
      { completion_date: "2025-03-01", expiry_date: "2026-03-10" },
    ]);

    expect(
      getPersonnelOperationalStatus({
        isActive: true,
        trainingSummary: expiredSummary,
      })
    ).toBe("suspended");

    expect(
      getPersonnelOperationalStatus({
        isActive: false,
        trainingSummary: expiredSummary,
      })
    ).toBe("archived");

    expect(getOperationalStatusMeta("active")).toMatchObject({
      label: "Attivo",
    });
    expect(getOperationalStatusMeta("suspended")).toMatchObject({
      label: "Sospeso",
    });
  });

  it("builds a descending timeline with danger and warning milestones", () => {
    const timeline = buildPersonnelTimeline({
      firstName: "Marco",
      hireDate: "2024-01-15",
      trainingSummary: getTrainingWindowSummary([]),
      trainingRecords: [
        { completion_date: "2026-01-10", expiry_date: "2026-04-10" },
        { completion_date: "2025-03-01", expiry_date: "2026-03-10" },
      ],
    });

    expect(timeline[0]).toMatchObject({
      date: "2026-04-10",
      title: "Scadenza formazione",
      tone: "warning",
    });
    expect(
      timeline.some(
        (event) =>
          event.date === "2026-03-10" &&
          event.title === "Formazione scaduta" &&
          event.tone === "danger"
      )
    ).toBe(true);
    expect(timeline.at(-1)).toMatchObject({
      date: "2024-01-15",
      title: "Ingresso in organico",
      tone: "default",
    });
  });
});
