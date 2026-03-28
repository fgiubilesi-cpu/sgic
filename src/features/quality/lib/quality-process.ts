type CorrectiveActionLike = {
  due_date?: string | null;
  status?: string | null;
  target_completion_date?: string | null;
};

type NonConformityLike = {
  corrective_actions?: CorrectiveActionLike[] | null;
  created_at?: string | null;
  identified_date?: string | null;
  severity?: string | null;
};

export type NonConformityProcessPressure =
  | "overdue"
  | "unplanned"
  | "ready_for_verification"
  | "in_execution";

function formatDateLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("it-IT");
}

export function getCorrectiveActionDeadline(action: CorrectiveActionLike): string | null {
  return action.target_completion_date ?? action.due_date ?? null;
}

export function getObservedDate(nc: NonConformityLike): string | null {
  return nc.identified_date ?? nc.created_at ?? null;
}

export function countCompletedCorrectiveActions(actions: CorrectiveActionLike[] | null | undefined): number {
  return (actions ?? []).filter((action) => action.status === "completed").length;
}

export function countOpenCorrectiveActions(actions: CorrectiveActionLike[] | null | undefined): number {
  return (actions ?? []).filter((action) => action.status !== "completed").length;
}

export function countOverdueCorrectiveActions(
  actions: CorrectiveActionLike[] | null | undefined,
  today: Date = new Date()
): number {
  return (actions ?? []).filter((action) => {
    if (action.status === "completed") return false;
    const deadline = getCorrectiveActionDeadline(action);
    if (!deadline) return false;
    return new Date(deadline) < today;
  }).length;
}

export function getNextCorrectiveActionDeadline(
  actions: CorrectiveActionLike[] | null | undefined
): string | null {
  const deadlines = (actions ?? [])
    .filter((action) => action.status !== "completed")
    .map(getCorrectiveActionDeadline)
    .filter((deadline): deadline is string => Boolean(deadline))
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime());

  return deadlines[0] ?? null;
}

export function getNonConformityProcessPressure(
  nc: NonConformityLike,
  today: Date = new Date()
): NonConformityProcessPressure {
  const totalActions = nc.corrective_actions?.length ?? 0;
  const openActions = countOpenCorrectiveActions(nc.corrective_actions);
  const overdueActions = countOverdueCorrectiveActions(nc.corrective_actions, today);

  if (overdueActions > 0) return "overdue";
  if (totalActions === 0) return "unplanned";
  if (openActions === 0) return "ready_for_verification";
  return "in_execution";
}

export function getNonConformityActionSummary(
  nc: NonConformityLike,
  today: Date = new Date()
): { detail: string | null; label: string; tone: "critical" | "neutral" | "success" | "warning" } {
  const totalActions = nc.corrective_actions?.length ?? 0;
  const completedActions = countCompletedCorrectiveActions(nc.corrective_actions);
  const openActions = totalActions - completedActions;
  const overdueActions = countOverdueCorrectiveActions(nc.corrective_actions, today);
  const nextDeadline = getNextCorrectiveActionDeadline(nc.corrective_actions);

  if (totalActions === 0) {
    return {
      label: "Da pianificare",
      detail: "Nessuna azione correttiva definita.",
      tone: "warning",
    };
  }

  if (overdueActions > 0) {
    return {
      label: `${overdueActions} in ritardo`,
      detail: nextDeadline ? `Prossima scadenza ${formatDateLabel(nextDeadline)}.` : "Serve un riallineamento delle scadenze.",
      tone: "critical",
    };
  }

  if (openActions === 0) {
    return {
      label: "Pronta per verifica",
      detail: "Tutte le azioni correttive risultano completate.",
      tone: "success",
    };
  }

  return {
    label: `${openActions} aperte su ${totalActions}`,
    detail: nextDeadline ? `Prossima scadenza ${formatDateLabel(nextDeadline)}.` : "Manca almeno una data obiettivo.",
    tone: nextDeadline ? "neutral" : "warning",
  };
}

export function getNonConformityOverviewMetrics(
  ncs: NonConformityLike[],
  today: Date = new Date()
): {
  critical: number;
  overdue: number;
  readyForVerification: number;
  total: number;
  unplanned: number;
} {
  return ncs.reduce(
    (accumulator, nc) => {
      accumulator.total += 1;

      if (nc.severity === "critical") {
        accumulator.critical += 1;
      }

      const pressure = getNonConformityProcessPressure(nc, today);

      if (pressure === "overdue") {
        accumulator.overdue += 1;
      }

      if (pressure === "unplanned") {
        accumulator.unplanned += 1;
      }

      if (pressure === "ready_for_verification") {
        accumulator.readyForVerification += 1;
      }

      return accumulator;
    },
    {
      critical: 0,
      overdue: 0,
      readyForVerification: 0,
      total: 0,
      unplanned: 0,
    }
  );
}
