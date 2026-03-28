import { describe, expect, it } from "vitest";

import {
  countCompletedCorrectiveActions,
  countOverdueCorrectiveActions,
  getCorrectiveActionDeadline,
  getNonConformityActionSummary,
  getNonConformityOverviewMetrics,
  getNonConformityProcessPressure,
  getObservedDate,
} from "./quality-process";

describe("quality-process", () => {
  const today = new Date("2026-03-27T10:00:00.000Z");

  it("prefers target completion date when available", () => {
    expect(
      getCorrectiveActionDeadline({
        due_date: "2026-04-05",
        target_completion_date: "2026-04-01",
      })
    ).toBe("2026-04-01");
  });

  it("falls back to created_at when identified date is missing", () => {
    expect(getObservedDate({ created_at: "2026-03-20", identified_date: null })).toBe("2026-03-20");
  });

  it("counts completed and overdue corrective actions", () => {
    const actions = [
      { status: "completed", target_completion_date: "2026-03-10" },
      { status: "pending", target_completion_date: "2026-03-15" },
      { status: "in_progress", due_date: "2026-03-30" },
    ];

    expect(countCompletedCorrectiveActions(actions)).toBe(1);
    expect(countOverdueCorrectiveActions(actions, today)).toBe(1);
  });

  it("marks an nc without actions as unplanned", () => {
    expect(
      getNonConformityProcessPressure(
        {
          corrective_actions: [],
          severity: "major",
        },
        today
      )
    ).toBe("unplanned");
  });

  it("marks an nc with completed actions as ready for verification", () => {
    const nc = {
      corrective_actions: [{ status: "completed", target_completion_date: "2026-03-15" }],
      severity: "major",
    };

    expect(getNonConformityProcessPressure(nc, today)).toBe("ready_for_verification");
    expect(getNonConformityActionSummary(nc, today)).toMatchObject({
      label: "Pronta per verifica",
      tone: "success",
    });
  });

  it("builds overview metrics for the active nc portfolio", () => {
    const metrics = getNonConformityOverviewMetrics(
      [
        {
          corrective_actions: [],
          severity: "critical",
        },
        {
          corrective_actions: [{ status: "pending", target_completion_date: "2026-03-20" }],
          severity: "major",
        },
        {
          corrective_actions: [{ status: "completed", target_completion_date: "2026-03-10" }],
          severity: "minor",
        },
      ],
      today
    );

    expect(metrics).toEqual({
      critical: 1,
      overdue: 1,
      readyForVerification: 1,
      total: 3,
      unplanned: 1,
    });
  });
});
