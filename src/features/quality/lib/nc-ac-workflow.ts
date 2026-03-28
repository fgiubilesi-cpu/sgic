import type { ACStatus, NCStatus } from "../schemas/nc-ac.schema";

type WorkflowCorrectiveAction = {
  status: ACStatus;
};

export function resolveNonConformityStatusFromCorrectiveActions(
  currentStatus: NCStatus,
  actions: WorkflowCorrectiveAction[]
): NCStatus {
  if (actions.length === 0) {
    return currentStatus;
  }

  const hasOpenActions = actions.some((action) => action.status !== "completed");

  if (hasOpenActions) {
    return "open";
  }

  if (currentStatus === "closed") {
    return "closed";
  }

  return "pending_verification";
}
