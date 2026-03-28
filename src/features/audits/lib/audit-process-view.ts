import type { CorrectiveAction } from "@/features/audits/queries/get-corrective-actions";

type CorrectiveActionFocusTone = "critical" | "neutral" | "success" | "warning";

export function getAuditCorrectiveActionDeadline(action: CorrectiveAction): string | null {
  return action.targetCompletionDate ?? action.dueDate ?? null;
}

export function formatAuditDateLabel(
  value: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "it-IT",
    options ?? {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

export function isAuditCorrectiveActionOverdue(
  action: CorrectiveAction,
  today: Date = new Date()
): boolean {
  if (action.status === "completed") return false;

  const deadline = getAuditCorrectiveActionDeadline(action);
  if (!deadline) return false;

  const normalizedToday = new Date(today);
  normalizedToday.setHours(0, 0, 0, 0);

  const dueDate = new Date(deadline);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < normalizedToday;
}

export function getCorrectiveActionOperationalFocus(
  action: CorrectiveAction,
  today: Date = new Date()
): { detail: string | null; label: string; tone: CorrectiveActionFocusTone } {
  const deadline = getAuditCorrectiveActionDeadline(action);

  if (action.status === "completed") {
    return {
      label: "Completata",
      detail: action.completedAt
        ? `Chiusa il ${formatAuditDateLabel(action.completedAt)}.`
        : "Attivita completata e pronta per verifica.",
      tone: "success",
    };
  }

  if (isAuditCorrectiveActionOverdue(action, today)) {
    return {
      label: "Scadenza superata",
      detail: deadline
        ? `Da chiudere dal ${formatAuditDateLabel(deadline)}.`
        : "Serve riallineare la data obiettivo.",
      tone: "critical",
    };
  }

  if (!action.responsiblePersonName && !deadline) {
    return {
      label: "Presa in carico incompleta",
      detail: "Mancano responsabile e data obiettivo.",
      tone: "warning",
    };
  }

  if (!action.responsiblePersonName) {
    return {
      label: "Responsabile mancante",
      detail: deadline
        ? `Scadenza ${formatAuditDateLabel(deadline)}.`
        : "Serve un assegnatario operativo.",
      tone: "warning",
    };
  }

  if (!deadline) {
    return {
      label: "Data obiettivo mancante",
      detail: `${action.responsiblePersonName} e gia assegnato, ma manca la scadenza.`,
      tone: "warning",
    };
  }

  return {
    label: action.status === "in_progress" ? "In esecuzione" : "Da avviare",
    detail: `${action.responsiblePersonName} · scadenza ${formatAuditDateLabel(deadline)}.`,
    tone: "neutral",
  };
}

export function sortCorrectiveActionsForAudit(
  actions: CorrectiveAction[],
  today: Date = new Date()
): CorrectiveAction[] {
  return [...actions].sort((left, right) => {
    const leftCompleted = left.status === "completed" ? 1 : 0;
    const rightCompleted = right.status === "completed" ? 1 : 0;

    if (leftCompleted !== rightCompleted) {
      return leftCompleted - rightCompleted;
    }

    const leftOverdue = isAuditCorrectiveActionOverdue(left, today) ? 1 : 0;
    const rightOverdue = isAuditCorrectiveActionOverdue(right, today) ? 1 : 0;

    if (leftOverdue !== rightOverdue) {
      return rightOverdue - leftOverdue;
    }

    const leftDeadline = getAuditCorrectiveActionDeadline(left);
    const rightDeadline = getAuditCorrectiveActionDeadline(right);

    if (leftDeadline && rightDeadline) {
      const deadlineDiff =
        new Date(leftDeadline).getTime() - new Date(rightDeadline).getTime();

      if (deadlineDiff !== 0) {
        return deadlineDiff;
      }
    }

    if (leftDeadline && !rightDeadline) {
      return -1;
    }

    if (!leftDeadline && rightDeadline) {
      return 1;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}
