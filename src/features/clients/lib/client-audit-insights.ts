import type { AuditTimelineEvent } from '@/features/audits/queries/get-audit-timeline';

export type ClientAuditItem = {
  id: string;
  nc_count: number;
  title: string | null;
  status: string;
  scheduled_date: string | null;
  score: number | null;
  location_name: string | null;
};

export interface ClientAuditLocationBenchmark {
  auditCount: number;
  averageScore: number | null;
  lastAuditDate: string | null;
  locationName: string;
  openNcCount: number;
}

export interface ClientAuditInsights {
  averageScore: number | null;
  latestScore: number | null;
  previousScore: number | null;
  recentTrend: Array<{
    date: string | null;
    id: string;
    nc_count: number;
    score: number;
    title: string | null;
  }>;
  recommendations: string[];
  scoreDelta: number | null;
  strongestLocation: ClientAuditLocationBenchmark | null;
  timelineEvents: AuditTimelineEvent[];
  weakestLocation: ClientAuditLocationBenchmark | null;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function buildClientAuditInsights(
  audits: ClientAuditItem[],
  timelineEvents: AuditTimelineEvent[]
): ClientAuditInsights {
  const scoredAudits = audits
    .filter((audit): audit is ClientAuditItem & { score: number } => typeof audit.score === 'number')
    .sort(
      (left, right) =>
        new Date(right.scheduled_date ?? 0).getTime() - new Date(left.scheduled_date ?? 0).getTime()
    );

  const recentScoredAudits = scoredAudits.slice(0, 6);
  const recentTrend = recentScoredAudits.map((audit) => ({
    date: audit.scheduled_date,
    id: audit.id,
    nc_count: audit.nc_count,
    score: audit.score,
    title: audit.title,
  }));
  const latestScore = recentScoredAudits[0]?.score ?? null;
  const previousScore = recentScoredAudits[1]?.score ?? null;
  const scoreDelta =
    latestScore !== null && previousScore !== null ? latestScore - previousScore : null;

  const locationBuckets = audits.reduce<Record<string, ClientAuditLocationBenchmark>>((acc, audit) => {
    const key = audit.location_name || 'Sede non assegnata';

    if (!acc[key]) {
      acc[key] = {
        auditCount: 0,
        averageScore: null,
        lastAuditDate: null,
        locationName: key,
        openNcCount: 0,
      };
    }

    const current = acc[key];
    current.auditCount += 1;
    current.openNcCount += audit.nc_count;

    if (
      audit.scheduled_date &&
      (!current.lastAuditDate || new Date(audit.scheduled_date) > new Date(current.lastAuditDate))
    ) {
      current.lastAuditDate = audit.scheduled_date;
    }

    const scores = audits
      .filter((candidate) => (candidate.location_name || 'Sede non assegnata') === key)
      .flatMap((candidate) => (typeof candidate.score === 'number' ? [candidate.score] : []));

    current.averageScore = average(scores);
    return acc;
  }, {});

  const sortedBenchmarks = Object.values(locationBuckets).sort((left, right) => {
    const leftScore = left.averageScore ?? -1;
    const rightScore = right.averageScore ?? -1;
    return rightScore - leftScore || right.auditCount - left.auditCount;
  });

  const recommendations: string[] = [];
  const openNcCount = audits.reduce((sum, audit) => sum + audit.nc_count, 0);

  if (openNcCount > 0) {
    recommendations.push(`Chiudere ${openNcCount} NC aperte prima del prossimo ciclo di audit.`);
  }

  if (scoreDelta !== null && scoreDelta < 0) {
    recommendations.push(
      `Lo score dell'ultimo audit e sceso di ${Math.abs(scoreDelta).toFixed(1)} punti rispetto al precedente.`
    );
  }

  const weakestLocation = [...sortedBenchmarks]
    .filter((benchmark) => benchmark.averageScore !== null)
    .sort((left, right) => (left.averageScore ?? 101) - (right.averageScore ?? 101))[0] ?? null;

  if (weakestLocation && (weakestLocation.averageScore ?? 100) < 80) {
    recommendations.push(
      `La sede ${weakestLocation.locationName} ha uno score medio basso e va seguita con priorita.`
    );
  }

  if (timelineEvents.filter((event) => event.status === 'Scheduled').length > 0) {
    recommendations.push('Ci sono audit pianificati: prepara evidenze e documentazione prima della visita.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Trend audit stabile: il cliente non mostra criticita immediate.');
  }

  return {
    averageScore: average(scoredAudits.map((audit) => audit.score)),
    latestScore,
    previousScore,
    recentTrend,
    recommendations,
    scoreDelta,
    strongestLocation: sortedBenchmarks[0] ?? null,
    timelineEvents,
    weakestLocation,
  };
}
