export type ClientRiskRadarLevel = "attention" | "critical" | "high" | "stable";
export type ClientRiskRadarTone = "danger" | "default" | "warning";

export interface ClientRiskRadarDriver {
  label: string;
  points: number;
  tone: ClientRiskRadarTone;
}

export interface ClientRiskRadar {
  className: string;
  drivers: ClientRiskRadarDriver[];
  label: string;
  level: ClientRiskRadarLevel;
  score: number;
  summary: string;
}

export interface ClientRiskRadarInput {
  averageAuditScore?: number | null;
  criticalNcCount?: number;
  expiringDocumentCount?: number;
  missingPresidio?: boolean;
  missingServiceCoverage?: boolean;
  openNcCount?: number;
  overdueActionCount?: number;
  overdueDocumentCount?: number;
  overduePressureCount?: number;
  overdueTaskCount?: number;
  overdueTrainingCount?: number;
  reviewQueueCount?: number;
  scoreDelta?: number | null;
  upcomingAuditCount?: number;
}

function addDriver(
  drivers: ClientRiskRadarDriver[],
  label: string,
  rawPoints: number,
  tone: ClientRiskRadarTone
) {
  const points = Math.max(0, Math.round(rawPoints));
  if (points <= 0) return;
  drivers.push({ label, points, tone });
}

function labelForLevel(level: ClientRiskRadarLevel) {
  if (level === "critical") return "Critico";
  if (level === "high") return "Alto";
  if (level === "attention") return "Attenzione";
  return "Stabile";
}

function classNameForLevel(level: ClientRiskRadarLevel) {
  if (level === "critical") return "border-rose-200 bg-rose-50 text-rose-700";
  if (level === "high") return "border-amber-200 bg-amber-50 text-amber-700";
  if (level === "attention") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function levelFromScore(score: number): ClientRiskRadarLevel {
  if (score >= 60) return "critical";
  if (score >= 35) return "high";
  if (score >= 15) return "attention";
  return "stable";
}

export function buildClientRiskRadar(input: ClientRiskRadarInput): ClientRiskRadar {
  const drivers: ClientRiskRadarDriver[] = [];
  const criticalNcCount = input.criticalNcCount ?? 0;
  const openNcCount = input.openNcCount ?? 0;
  const overdueActionCount = input.overdueActionCount ?? 0;
  const overdueDocumentCount = input.overdueDocumentCount ?? 0;
  const overduePressureCount = input.overduePressureCount ?? 0;
  const expiringDocumentCount = input.expiringDocumentCount ?? 0;
  const reviewQueueCount = input.reviewQueueCount ?? 0;
  const overdueTaskCount = input.overdueTaskCount ?? 0;
  const overdueTrainingCount = input.overdueTrainingCount ?? 0;
  const averageAuditScore = input.averageAuditScore ?? null;
  const scoreDelta = input.scoreDelta ?? null;

  addDriver(
    drivers,
    `${criticalNcCount} NC critiche`,
    Math.min(criticalNcCount * 18, 36),
    "danger"
  );
  addDriver(
    drivers,
    `${Math.max(openNcCount - criticalNcCount, 0)} NC aperte`,
    Math.min(Math.max(openNcCount - criticalNcCount, 0) * 6, 18),
    "warning"
  );
  addDriver(
    drivers,
    `${overdueActionCount} AC scadute`,
    Math.min(overdueActionCount * 12, 24),
    "danger"
  );
  addDriver(
    drivers,
    `${overdueDocumentCount} documenti scaduti`,
    Math.min(overdueDocumentCount * 8, 16),
    "warning"
  );
  addDriver(
    drivers,
    `${expiringDocumentCount} documenti da presidiare`,
    Math.min(expiringDocumentCount * 4, 12),
    "warning"
  );
  addDriver(
    drivers,
    `${reviewQueueCount} documenti in review`,
    Math.min(reviewQueueCount * 5, 15),
    "warning"
  );
  addDriver(
    drivers,
    `${overdueTaskCount} task oltre termine`,
    Math.min(overdueTaskCount * 6, 18),
    "warning"
  );
  addDriver(
    drivers,
    `${overduePressureCount} scadenze operative oltre termine`,
    Math.min(overduePressureCount * 5, 15),
    "warning"
  );
  addDriver(
    drivers,
    `${overdueTrainingCount} scadenze formazione/medical oltre termine`,
    Math.min(overdueTrainingCount * 7, 14),
    "warning"
  );

  if (averageAuditScore !== null) {
    if (averageAuditScore < 70) {
      addDriver(drivers, "Score audit medio sotto 70%", 18, "danger");
    } else if (averageAuditScore < 85) {
      addDriver(drivers, "Score audit medio sotto 85%", 8, "warning");
    }
  }

  if (scoreDelta !== null) {
    if (scoreDelta <= -10) {
      addDriver(drivers, "Trend audit in forte calo", 12, "danger");
    } else if (scoreDelta < 0) {
      addDriver(drivers, "Trend audit in calo", 6, "warning");
    }
  }

  if ((input.upcomingAuditCount ?? 0) > 0 && (openNcCount > 0 || overdueActionCount > 0)) {
    addDriver(drivers, "Audit imminenti con backlog aperto", 6, "warning");
  }

  if (input.missingServiceCoverage) {
    addDriver(drivers, "Copertura servizi da allineare", 10, "warning");
  }

  if (input.missingPresidio) {
    addDriver(drivers, "Presidio interno mancante", 8, "warning");
  }

  const sortedDrivers = drivers.sort((left, right) => right.points - left.points);
  const score = Math.min(
    sortedDrivers.reduce((total, driver) => total + driver.points, 0),
    100
  );
  const level = levelFromScore(score);
  const label = labelForLevel(level);
  const className = classNameForLevel(level);
  const summary =
    sortedDrivers.length > 0
      ? sortedDrivers
          .slice(0, 2)
          .map((driver) => driver.label)
          .join(" · ")
      : "Nessuna pressione critica rilevata.";

  return {
    className,
    drivers: sortedDrivers.slice(0, 4),
    label,
    level,
    score,
    summary,
  };
}
