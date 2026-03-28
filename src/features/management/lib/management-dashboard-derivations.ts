import { buildClientRiskRadar } from "@/features/clients/lib/client-risk-radar";

export type ManagementCoverageBucket = {
  annualValue: number;
  nativeClients: Set<string>;
  recurringCount: number;
  serviceLineCount: number;
  stagingClients: Set<string>;
};

export type ManagementCoverageRowLike = {
  annualValue: number;
  clientCount: number;
  label: string;
  nativeClientCount: number;
  recurringCount: number;
  serviceLineCount: number;
  source: "blended" | "native" | "staging";
  stagingClientCount: number;
};

export type ManagementDueItemLike = {
  clientId: string | null;
  clientName: string;
  dueDate: string;
  href: string;
  label: string;
  priority: string | null;
  source: "sgic" | "staging";
  status: "overdue" | "due_soon" | "planned";
  type: "audit" | "contract" | "deadline" | "document" | "task";
};

export type ManagementPortfolioRowLike = {
  activeLocations: number;
  activePersonnel: number;
  attentionReasons: string[];
  clientHref: string;
  clientId: string | null;
  clientKey: string;
  clientName: string;
  coverageStatus: "covered" | "partial" | "uncovered";
  expiringDocuments: number;
  lastAuditDate: string | null;
  openNCs: number;
  overdueActions: number;
  overdueItems: number;
  riskScore: number;
  serviceAreas: number;
  serviceLines: number;
  source: "merged" | "sgic" | "staging";
};

export type ManagementStagingOnlyClientAccumulator = {
  activeLocations: number;
  annualValue: number;
  clientCode: string | null;
  clientName: string;
  contractDueCount: number;
  deadlineDueCount: number;
  key: string;
  overdueItems: number;
  plannedAssignments: number;
  plannedHours: number;
  serviceAreas: Set<string>;
  serviceLines: number;
};

export function startOfToday(referenceDate = new Date()) {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function normalizeStatus(status: string | null | undefined) {
  return (status ?? "").trim().toLowerCase();
}

export function normalizeLookupValue(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isClosedLikeStatus(status: string | null | undefined) {
  const normalized = normalizeStatus(status);
  return [
    "archived",
    "cancelled",
    "closed",
    "completed",
    "done",
    "expired",
    "inactive",
  ].includes(normalized);
}

export function isRecurringCadence(cadence: string | null | undefined) {
  const normalized = normalizeLookupValue(cadence);
  return Boolean(normalized) && !["one-shot", "singolo", "spot", "una tantum"].includes(normalized);
}

export function addToSetMap(map: Map<string, Set<string>>, key: string, value: string) {
  const bucket = map.get(key) ?? new Set<string>();
  bucket.add(value);
  map.set(key, bucket);
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function compareDateStrings(left: string, right: string) {
  return new Date(left).getTime() - new Date(right).getTime();
}

export function classifyDueDate(dateString: string, todayKey: string, soonLimitKey: string) {
  if (dateString < todayKey) return "overdue" as const;
  if (dateString <= soonLimitKey) return "due_soon" as const;
  return "planned" as const;
}

export function buildManagementCoverageRows(
  coverageRowsMap: Map<string, ManagementCoverageBucket>
): ManagementCoverageRowLike[] {
  return Array.from(coverageRowsMap.entries())
    .map<ManagementCoverageRowLike>(([label, value]) => {
      const nativeClientCount = value.nativeClients.size;
      const stagingClientCount = value.stagingClients.size;

      return {
        annualValue: value.annualValue,
        clientCount: nativeClientCount + stagingClientCount,
        label,
        nativeClientCount,
        recurringCount: value.recurringCount,
        serviceLineCount: value.serviceLineCount,
        source:
          nativeClientCount > 0 && stagingClientCount > 0
            ? "blended"
            : nativeClientCount > 0
              ? "native"
              : "staging",
        stagingClientCount,
      };
    })
    .sort((left, right) => {
      if (right.clientCount !== left.clientCount) {
        return right.clientCount - left.clientCount;
      }

      return right.serviceLineCount - left.serviceLineCount;
    });
}

export function buildNativePortfolioRow(input: {
  client: { id: string; name: string };
  criticalNcByClient: Map<string, number>;
  expiringDocumentsByClient: Map<string, number>;
  fallbackPresidioByClient: Map<string, number>;
  fallbackServiceAreasByClient: Map<string, Set<string>>;
  fallbackServicesByClient: Map<string, number>;
  lastAuditDateByClient: Map<string, string>;
  locationsByClient: Map<string, number>;
  nativeActivePersonnelByClient: Map<string, number>;
  nativeServiceAreasByClient: Map<string, Set<string>>;
  nativeServicesByClient: Map<string, number>;
  openNcByClient: Map<string, number>;
  overdueActionsByClient: Map<string, number>;
  overdueItemsByClient: Map<string, number>;
  stagingSignalsByClient: Set<string>;
}): ManagementPortfolioRowLike {
  const nativeServiceLinesCount = input.nativeServicesByClient.get(input.client.id) ?? 0;
  const fallbackServiceLinesCount = input.fallbackServicesByClient.get(input.client.id) ?? 0;
  const serviceLinesCount =
    nativeServiceLinesCount > 0 ? nativeServiceLinesCount : fallbackServiceLinesCount;
  const serviceAreasCount =
    nativeServiceLinesCount > 0
      ? input.nativeServiceAreasByClient.get(input.client.id)?.size ?? 0
      : input.fallbackServiceAreasByClient.get(input.client.id)?.size ?? 0;
  const nativePersonnelCount = input.nativeActivePersonnelByClient.get(input.client.id) ?? 0;
  const fallbackPresidioCount = input.fallbackPresidioByClient.get(input.client.id) ?? 0;
  const activePersonnelCount =
    nativePersonnelCount > 0 ? nativePersonnelCount : fallbackPresidioCount;
  const openNCs = input.openNcByClient.get(input.client.id) ?? 0;
  const criticalNCs = input.criticalNcByClient.get(input.client.id) ?? 0;
  const overdueActions = input.overdueActionsByClient.get(input.client.id) ?? 0;
  const overdueItems = input.overdueItemsByClient.get(input.client.id) ?? 0;
  const expiringDocuments = input.expiringDocumentsByClient.get(input.client.id) ?? 0;
  const usesStagingFallback = fallbackServiceLinesCount > 0 || fallbackPresidioCount > 0;

  const radar = buildClientRiskRadar({
    criticalNcCount: criticalNCs,
    expiringDocumentCount: expiringDocuments,
    missingPresidio: activePersonnelCount === 0,
    missingServiceCoverage: serviceLinesCount === 0,
    openNcCount: openNCs,
    overdueActionCount: overdueActions,
    overduePressureCount: overdueItems,
  });

  const attentionReasons: string[] = [];
  if (usesStagingFallback && nativeServiceLinesCount === 0 && fallbackServiceLinesCount > 0) {
    attentionReasons.push("copertura servizi letta da staging FileMaker");
  }
  if (usesStagingFallback && nativePersonnelCount === 0 && fallbackPresidioCount > 0) {
    attentionReasons.push("presidio interno letto da staging FileMaker");
  }
  if (criticalNCs > 0) {
    attentionReasons.push(`${criticalNCs} NC critiche`);
  }
  if (overdueActions > 0) {
    attentionReasons.push(`${overdueActions} AC scadute`);
  }
  if (overdueItems > 0) {
    attentionReasons.push(`${overdueItems} scadenze oltre termine`);
  }
  if (expiringDocuments > 0) {
    attentionReasons.push(`${expiringDocuments} documenti in scadenza`);
  }
  if (serviceLinesCount === 0) {
    attentionReasons.push("copertura servizi da allineare");
  }
  if (activePersonnelCount === 0) {
    attentionReasons.push("nessun presidio interno associato");
  }
  if (attentionReasons.length === 0) {
    attentionReasons.push("nessuna criticita immediata");
  }

  const coverageStatus =
    serviceLinesCount === 0 ? "uncovered" : serviceLinesCount < 3 ? "partial" : "covered";

  return {
    activeLocations: input.locationsByClient.get(input.client.id) ?? 0,
    activePersonnel: activePersonnelCount,
    attentionReasons,
    clientHref: `/clients/${input.client.id}`,
    clientId: input.client.id,
    clientKey: input.client.id,
    clientName: input.client.name,
    coverageStatus,
    expiringDocuments,
    lastAuditDate: input.lastAuditDateByClient.get(input.client.id) ?? null,
    openNCs,
    overdueActions,
    overdueItems,
    riskScore: radar.score,
    serviceAreas: serviceAreasCount,
    serviceLines: serviceLinesCount,
    source: input.stagingSignalsByClient.has(input.client.id) ? "merged" : "sgic",
  };
}

export function buildStagingPortfolioRow(
  client: ManagementStagingOnlyClientAccumulator
): ManagementPortfolioRowLike {
  const radar = buildClientRiskRadar({
    missingPresidio: client.plannedAssignments === 0,
    missingServiceCoverage: client.serviceLines === 0,
    overduePressureCount: client.overdueItems,
  });

  const attentionReasons = ["cliente importato da FileMaker", "mappatura SGIC da completare"];
  if (client.overdueItems > 0) {
    attentionReasons.unshift(`${client.overdueItems} scadenze oltre termine`);
  }
  if (client.deadlineDueCount > 0 && client.overdueItems === 0) {
    attentionReasons.push(`${client.deadlineDueCount} scadenze importate`);
  }
  if (client.contractDueCount > 0) {
    attentionReasons.push(`${client.contractDueCount} rinnovi/contratti importati`);
  }
  if (client.serviceLines === 0) {
    attentionReasons.push("copertura servizi non ancora importata");
  }
  if (client.plannedAssignments === 0) {
    attentionReasons.push("nessun presidio staging pianificato");
  } else if (client.plannedHours > 0) {
    attentionReasons.push(`${client.plannedHours}h di presidio pianificate`);
  }

  const coverageStatus =
    client.serviceLines === 0 ? "uncovered" : client.serviceLines < 3 ? "partial" : "covered";

  return {
    activeLocations: client.activeLocations,
    activePersonnel: client.plannedAssignments,
    attentionReasons,
    clientHref: "/management",
    clientId: null,
    clientKey: `staging:${client.key}`,
    clientName: client.clientName,
    coverageStatus,
    expiringDocuments: 0,
    lastAuditDate: null,
    openNCs: 0,
    overdueActions: 0,
    overdueItems: client.overdueItems,
    riskScore: radar.score,
    serviceAreas: client.serviceAreas.size,
    serviceLines: client.serviceLines,
    source: "staging",
  };
}

export function dedupeAndSortDueItems<T extends ManagementDueItemLike>(dueItems: T[]) {
  const dueItemsByKey = new Map<string, T>();
  for (const item of dueItems) {
    const key = `${item.type}:${item.clientId ?? item.clientName}:${item.label}:${item.dueDate}`;
    if (!dueItemsByKey.has(key)) {
      dueItemsByKey.set(key, item);
    }
  }

  return Array.from(dueItemsByKey.values()).sort((left, right) =>
    compareDateStrings(left.dueDate, right.dueDate)
  );
}
