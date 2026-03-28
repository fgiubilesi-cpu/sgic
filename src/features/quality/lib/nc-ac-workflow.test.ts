import { describe, expect, it } from "vitest";

import { resolveNonConformityStatusFromCorrectiveActions } from "./nc-ac-workflow";

describe("nc-ac-workflow", () => {
  it("keeps the current status when there are no corrective actions", () => {
    expect(resolveNonConformityStatusFromCorrectiveActions("open", [])).toBe("open");
  });

  it("reopens the nc when at least one corrective action is still open", () => {
    expect(
      resolveNonConformityStatusFromCorrectiveActions("pending_verification", [
        { status: "completed" },
        { status: "pending" },
      ])
    ).toBe("open");
  });

  it("moves the nc to pending verification when all corrective actions are completed", () => {
    expect(
      resolveNonConformityStatusFromCorrectiveActions("open", [
        { status: "completed" },
        { status: "completed" },
      ])
    ).toBe("pending_verification");
  });

  it("preserves closed status when all corrective actions remain completed", () => {
    expect(
      resolveNonConformityStatusFromCorrectiveActions("closed", [{ status: "completed" }])
    ).toBe("closed");
  });

  it("reopens a closed nc if a corrective action becomes active again", () => {
    expect(
      resolveNonConformityStatusFromCorrectiveActions("closed", [{ status: "in_progress" }])
    ).toBe("open");
  });
});
