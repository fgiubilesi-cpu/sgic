export function buildAuditHistorySummary(
  events: Array<{ score: number | null; status: string | null }>
) {
  const totalAudits = events.length;
  const closedAudits = events.filter((event) => event.status === "Closed").length;
  const inProgressAudits = events.filter(
    (event) => event.status === "In Progress"
  ).length;
  const scoredEvents = events.filter((event) => event.score !== null);
  const averageCompliance =
    scoredEvents.length > 0
      ? Math.round(
          scoredEvents.reduce((sum, event) => sum + (event.score || 0), 0) /
            scoredEvents.length
        )
      : 0;

  return {
    averageCompliance,
    closedAudits,
    inProgressAudits,
    totalAudits,
  };
}
