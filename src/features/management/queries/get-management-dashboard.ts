import type { OrgContext } from "@/lib/supabase/get-org-context";
import { getTrainingWindowSummary } from "@/features/personnel/lib/personnel-status";

type ClientRow = {
  id: string;
  is_active: boolean | null;
  name: string;
};

type LocationRow = {
  client_id: string;
  id: string;
};

type AuditRow = {
  client_id: string | null;
  id: string;
  scheduled_date: string | null;
  status: string | null;
};

type NonConformityRow = {
  audit_id: string | null;
  id: string;
  severity: string | null;
  status: string | null;
};

type CorrectiveActionRow = {
  id: string;
  non_conformity_id: string;
  status: string | null;
  target_completion_date: string | null;
};

type DocumentRow = {
  category: string | null;
  client_id: string | null;
  expiry_date: string | null;
  id: string;
  status: string | null;
  title: string | null;
};

type PersonnelRow = {
  client_id: string | null;
  id: string;
  is_active: boolean;
};

type TrainingRecordRow = {
  completion_date: string;
  expiry_date: string | null;
  personnel_id: string;
};

type ServiceLineRow = {
  billing_phase: string | null;
  client_id: string;
  id: string;
  is_recurring: boolean;
  section: string | null;
  title: string;
  total_price: number | null;
};

type ClientDeadlineRow = {
  client_id: string;
  due_date: string;
  id: string;
  priority: string | null;
  status: string;
  title: string;
};

type ClientTaskRow = {
  audit_id: string | null;
  client_id: string;
  due_date: string | null;
  id: string;
  priority: string | null;
  status: string;
  title: string;
};

type ClientContractRow = {
  client_id: string;
  end_date: string | null;
  id: string;
  renewal_date: string | null;
  status: string;
};

type ManagementStagingClientRow = {
  active_locations_count: number | null;
  client_code: string | null;
  client_id: string | null;
  name: string;
  source_record_id: string;
  status: string | null;
};

type ManagementStagingServiceLineRow = {
  annual_value: number | null;
  cadence: string | null;
  client_id: string | null;
  client_source_record_id: string | null;
  service_area: string | null;
  service_name: string;
  source_record_id: string;
  status: string | null;
};

type ManagementStagingContractRow = {
  client_id: string | null;
  client_source_record_id: string | null;
  end_date: string | null;
  renewal_date: string | null;
  source_record_id: string;
  status: string | null;
};

type ManagementStagingDeadlineRow = {
  client_id: string | null;
  client_source_record_id: string | null;
  due_date: string;
  priority: string | null;
  source_record_id: string;
  status: string | null;
  title: string;
};

type ManagementStagingCapacityRow = {
  client_id: string | null;
  client_source_record_id: string | null;
  owner_name: string | null;
  period_end: string | null;
  period_start: string | null;
  planned_hours: number | null;
  personnel_id: string | null;
  source_record_id: string;
  status: string | null;
};

type ManagementSyncRunRow = {
  finished_at: string | null;
  records_written: number | null;
  started_at: string;
  status: string;
  sync_scope: string;
};

type Tone = "default" | "warning" | "danger";
type UntypedArrayResponse<T> = PromiseLike<{ data: T[] | null; error: unknown }>;
type UntypedQueryBuilder<T> = UntypedArrayResponse<T> & {
  eq: (column: string, value: unknown) => UntypedQueryBuilder<T>;
  limit: (count: number) => UntypedQueryBuilder<T>;
  order: (
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean }
  ) => UntypedQueryBuilder<T>;
  select: (columns: string) => UntypedQueryBuilder<T>;
};
type UntypedSupabase = {
  from: <T = unknown>(table: string) => UntypedQueryBuilder<T>;
};

export type ManagementMetric = {
  href: string;
  hint: string;
  label: string;
  tone: Tone;
  value: string;
};

export type ManagementPortfolioRow = {
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

export type ManagementCoverageRow = {
  annualValue: number;
  clientCount: number;
  label: string;
  nativeClientCount: number;
  recurringCount: number;
  serviceLineCount: number;
  source: "blended" | "native" | "staging";
  stagingClientCount: number;
};

export type ManagementDueItem = {
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

export type ManagementCapacitySummary = {
  activePersonnel: number;
  clientsWithoutPersonnel: number;
  effectiveCoverageUnits: number;
  expiringTrainingCount: number;
  expiredTrainingCount: number;
  linkedPersonnel: number;
  plannedHours: number;
  ratioClientsPerPerson: number | null;
  stagedAssignments: number;
  stagedClientsCovered: number;
  stagedUnmappedClients: number;
};

export type ManagementStagingSnapshot = {
  capacityAssignments: number;
  clientCount: number;
  contractCount: number;
  deadlineCount: number;
  mappedClientCount: number;
  plannedHours: number;
  serviceLineCount: number;
  unmappedClientCount: number;
};

export type ManagementSourceStatus = {
  lastSync: ManagementSyncRunRow | null;
  missingIntegrationTables: string[];
  missingOperationalTables: string[];
  mode: "sgic-native" | "sgic-plus-staging";
  stagingSnapshot: ManagementStagingSnapshot;
};

export type ManagementDashboardData = {
  capacity: ManagementCapacitySummary;
  coverageRows: ManagementCoverageRow[];
  dueItems: ManagementDueItem[];
  generatedAt: string;
  metrics: ManagementMetric[];
  organizationName: string | null;
  portfolioRows: ManagementPortfolioRow[];
  sourceStatus: ManagementSourceStatus;
};

type QueryResult<T> = PromiseLike<{ data: T[] | null; error: unknown }>;

function isTableMissingError(error: unknown) {
  const candidate = error as { code?: string; message?: string | null };
  return (
    candidate?.code === "42P01" ||
    candidate?.code === "42703" ||
    candidate?.code === "PGRST205" ||
    candidate?.message?.includes("Could not find the table") === true ||
    candidate?.message?.includes("Could not find the column") === true
  );
}

function fromUntyped<T>(supabase: unknown, table: string) {
  return (supabase as UntypedSupabase).from<T>(table);
}

async function safeArrayQuery<T>(
  query: QueryResult<T>,
  tableName: string,
  missingTables: Set<string>
) {
  const { data, error } = await query;

  if (error) {
    if (isTableMissingError(error)) {
      missingTables.add(tableName);
      return [] as T[];
    }

    throw error;
  }

  return data ?? [];
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function normalizeStatus(status: string | null | undefined) {
  return (status ?? "").trim().toLowerCase();
}

function normalizeLookupValue(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isClosedLikeStatus(status: string | null | undefined) {
  const normalized = normalizeStatus(status);
  return [
    "archived",
    "cancelled",
    "closed",
    "completed",
    "done",
    "expired",
    "inactive",
    "verified",
  ].includes(normalized);
}

function isRecurringCadence(cadence: string | null | undefined) {
  const normalized = normalizeLookupValue(cadence);
  return Boolean(normalized) && !["one-shot", "singolo", "spot", "una tantum"].includes(normalized);
}

function addToSetMap(map: Map<string, Set<string>>, key: string, value: string) {
  const bucket = map.get(key) ?? new Set<string>();
  bucket.add(value);
  map.set(key, bucket);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function compareDateStrings(left: string, right: string) {
  return new Date(left).getTime() - new Date(right).getTime();
}

function classifyDueDate(dateString: string, todayKey: string, soonLimitKey: string) {
  if (dateString < todayKey) return "overdue" as const;
  if (dateString <= soonLimitKey) return "due_soon" as const;
  return "planned" as const;
}

export async function getManagementDashboardData(
  ctx: OrgContext
): Promise<ManagementDashboardData> {
  const { organizationId, supabase } = ctx;
  const optionalTables = new Set<string>();
  const integrationTables = new Set<string>();
  const today = startOfToday();
  const todayKey = toDateKey(today);
  const soonLimitKey = toDateKey(addDays(today, 30));
  const contractLimitKey = toDateKey(addDays(today, 90));

  const [
    organizationResult,
    clientsResult,
    locationsResult,
    auditsResult,
    nonConformitiesResult,
    correctiveActionsResult,
    documents,
    personnel,
    trainingRecords,
    serviceLines,
    deadlines,
    tasks,
    contracts,
    syncRuns,
    stagingClients,
    stagingServiceLines,
    stagingContracts,
    stagingDeadlines,
    stagingCapacity,
  ] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", organizationId).single(),
    supabase
      .from("clients")
      .select("id, name, is_active")
      .eq("organization_id", organizationId)
      .order("name"),
    supabase
      .from("locations")
      .select("id, client_id")
      .eq("organization_id", organizationId),
    supabase
      .from("audits")
      .select("id, client_id, scheduled_date, status")
      .eq("organization_id", organizationId),
    supabase
      .from("non_conformities")
      .select("id, audit_id, severity, status")
      .eq("organization_id", organizationId),
    supabase
      .from("corrective_actions")
      .select("id, non_conformity_id, status, target_completion_date")
      .eq("organization_id", organizationId),
    safeArrayQuery<DocumentRow>(
      supabase
        .from("documents")
        .select("id, client_id, title, expiry_date, status, category")
        .eq("organization_id", organizationId),
      "documents",
      optionalTables
    ),
    safeArrayQuery<PersonnelRow>(
      supabase
        .from("personnel")
        .select("id, client_id, is_active")
        .eq("organization_id", organizationId),
      "personnel",
      optionalTables
    ),
    safeArrayQuery<TrainingRecordRow>(
      supabase
        .from("training_records")
        .select("personnel_id, completion_date, expiry_date")
        .eq("organization_id", organizationId),
      "training_records",
      optionalTables
    ),
    safeArrayQuery<ServiceLineRow>(
      fromUntyped<ServiceLineRow>(supabase, "client_service_lines")
        .select("id, client_id, title, section, billing_phase, is_recurring, total_price")
        .eq("organization_id", organizationId)
        .eq("active", true),
      "client_service_lines",
      optionalTables
    ),
    safeArrayQuery<ClientDeadlineRow>(
      fromUntyped<ClientDeadlineRow>(supabase, "client_deadlines")
        .select("id, client_id, title, due_date, status, priority")
        .eq("organization_id", organizationId),
      "client_deadlines",
      optionalTables
    ),
    safeArrayQuery<ClientTaskRow>(
      fromUntyped<ClientTaskRow>(supabase, "client_tasks")
        .select("id, client_id, audit_id, title, due_date, status, priority")
        .eq("organization_id", organizationId),
      "client_tasks",
      optionalTables
    ),
    safeArrayQuery<ClientContractRow>(
      fromUntyped<ClientContractRow>(supabase, "client_contracts")
        .select("id, client_id, renewal_date, end_date, status")
        .eq("organization_id", organizationId),
      "client_contracts",
      optionalTables
    ),
    safeArrayQuery<ManagementSyncRunRow>(
      fromUntyped<ManagementSyncRunRow>(supabase, "management_sync_runs")
        .select("status, started_at, finished_at, sync_scope, records_written")
        .eq("organization_id", organizationId)
        .order("started_at", { ascending: false })
        .limit(1),
      "management_sync_runs",
      integrationTables
    ),
    safeArrayQuery<ManagementStagingClientRow>(
      fromUntyped<ManagementStagingClientRow>(supabase, "management_clients_staging")
        .select("source_record_id, client_id, client_code, name, status, active_locations_count")
        .eq("organization_id", organizationId),
      "management_clients_staging",
      integrationTables
    ),
    safeArrayQuery<ManagementStagingServiceLineRow>(
      fromUntyped<ManagementStagingServiceLineRow>(supabase, "management_service_lines_staging")
        .select(
          "source_record_id, client_id, client_source_record_id, service_name, service_area, cadence, status, annual_value"
        )
        .eq("organization_id", organizationId),
      "management_service_lines_staging",
      integrationTables
    ),
    safeArrayQuery<ManagementStagingContractRow>(
      fromUntyped<ManagementStagingContractRow>(supabase, "management_contracts_staging")
        .select(
          "source_record_id, client_id, client_source_record_id, status, renewal_date, end_date"
        )
        .eq("organization_id", organizationId),
      "management_contracts_staging",
      integrationTables
    ),
    safeArrayQuery<ManagementStagingDeadlineRow>(
      fromUntyped<ManagementStagingDeadlineRow>(supabase, "management_deadlines_staging")
        .select("source_record_id, client_id, client_source_record_id, title, status, priority, due_date")
        .eq("organization_id", organizationId),
      "management_deadlines_staging",
      integrationTables
    ),
    safeArrayQuery<ManagementStagingCapacityRow>(
      fromUntyped<ManagementStagingCapacityRow>(supabase, "management_capacity_staging")
        .select(
          "source_record_id, client_id, client_source_record_id, personnel_id, owner_name, planned_hours, period_start, period_end, status"
        )
        .eq("organization_id", organizationId),
      "management_capacity_staging",
      integrationTables
    ),
  ]);

  if (organizationResult.error) throw organizationResult.error;
  if (clientsResult.error) throw clientsResult.error;
  if (locationsResult.error) throw locationsResult.error;
  if (auditsResult.error) throw auditsResult.error;
  if (nonConformitiesResult.error) throw nonConformitiesResult.error;
  if (correctiveActionsResult.error) throw correctiveActionsResult.error;

  const organizationName = organizationResult.data?.name ?? null;
  const clients = (clientsResult.data ?? []) as ClientRow[];
  const activeClients = clients.filter((client) => client.is_active !== false);
  const locations = (locationsResult.data ?? []) as LocationRow[];
  const audits = (auditsResult.data ?? []) as AuditRow[];
  const nonConformities = (nonConformitiesResult.data ?? []) as NonConformityRow[];
  const correctiveActions = (correctiveActionsResult.data ?? []) as CorrectiveActionRow[];
  const latestSync = syncRuns[0] ?? null;
  const clientNameById = new Map(clients.map((client) => [client.id, client.name]));
  const nativeClientIdByNormalizedName = new Map(
    activeClients.map((client) => [normalizeLookupValue(client.name), client.id])
  );
  const locationsByClient = new Map<string, number>();
  const nativeServicesByClient = new Map<string, number>();
  const fallbackServicesByClient = new Map<string, number>();
  const nativeServiceAreasByClient = new Map<string, Set<string>>();
  const fallbackServiceAreasByClient = new Map<string, Set<string>>();
  const coverageRowsMap = new Map<
    string,
    {
      annualValue: number;
      nativeClients: Set<string>;
      recurringCount: number;
      serviceLineCount: number;
      stagingClients: Set<string>;
    }
  >();
  const nativeActivePersonnelByClient = new Map<string, number>();
  const fallbackPresidioByClient = new Map<string, number>();
  const trainingRecordsByPersonnel = new Map<string, TrainingRecordRow[]>();
  const auditById = new Map(audits.map((audit) => [audit.id, audit]));
  const ncById = new Map(nonConformities.map((nc) => [nc.id, nc]));
  const openNcByClient = new Map<string, number>();
  const criticalNcByClient = new Map<string, number>();
  const overdueActionsByClient = new Map<string, number>();
  const overdueItemsByClient = new Map<string, number>();
  const expiringDocumentsByClient = new Map<string, number>();
  const nativeDeadlineCountByClient = new Map<string, number>();
  const nativeContractCountByClient = new Map<string, number>();
  const lastAuditDateByClient = new Map<string, string>();
  const dueItems: ManagementDueItem[] = [];
  const stagingSignalsByClient = new Set<string>();

  type ResolvedStagingClient = {
    activeLocationsCount: number;
    clientCode: string | null;
    clientName: string;
    nativeClientId: string | null;
    sourceRecordId: string;
  };

  type StagingOnlyClientAccumulator = {
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

  const stagingClientBySourceRecordId = new Map<string, ResolvedStagingClient>();
  const stagingOnlyClients = new Map<string, StagingOnlyClientAccumulator>();

  const addCoverageRow = (
    label: string,
    annualValue: number,
    clientKey: string,
    source: "native" | "staging",
    recurring: boolean
  ) => {
    const bucket = coverageRowsMap.get(label) ?? {
      annualValue: 0,
      nativeClients: new Set<string>(),
      recurringCount: 0,
      serviceLineCount: 0,
      stagingClients: new Set<string>(),
    };

    bucket.annualValue += annualValue;
    bucket.serviceLineCount += 1;
    if (recurring) {
      bucket.recurringCount += 1;
    }

    if (source === "native") {
      bucket.nativeClients.add(clientKey);
    } else {
      bucket.stagingClients.add(clientKey);
    }

    coverageRowsMap.set(label, bucket);
  };

  const getOrCreateStagingOnlyClient = (
    key: string,
    fallbackName?: string | null,
    fallbackCode?: string | null,
    activeLocationsCount?: number | null
  ) => {
    const existing = stagingOnlyClients.get(key);

    if (existing) {
      if (activeLocationsCount !== undefined && activeLocationsCount !== null) {
        existing.activeLocations = activeLocationsCount;
      }
      if (!existing.clientCode && fallbackCode) {
        existing.clientCode = fallbackCode;
      }
      if (fallbackName && existing.clientName === "Cliente FileMaker") {
        existing.clientName = fallbackName;
      }
      return existing;
    }

    const stagingClient = stagingClientBySourceRecordId.get(key);
    const entry: StagingOnlyClientAccumulator = {
      activeLocations: activeLocationsCount ?? stagingClient?.activeLocationsCount ?? 0,
      annualValue: 0,
      clientCode: fallbackCode ?? stagingClient?.clientCode ?? null,
      clientName: fallbackName ?? stagingClient?.clientName ?? "Cliente FileMaker",
      contractDueCount: 0,
      deadlineDueCount: 0,
      key,
      overdueItems: 0,
      plannedAssignments: 0,
      plannedHours: 0,
      serviceAreas: new Set<string>(),
      serviceLines: 0,
    };

    stagingOnlyClients.set(key, entry);
    return entry;
  };

  const resolveStagingClient = (
    clientId: string | null,
    clientSourceRecordId: string | null,
    fallbackName?: string | null
  ): ResolvedStagingClient => {
    if (clientId && clientNameById.has(clientId)) {
      return {
        activeLocationsCount: locationsByClient.get(clientId) ?? 0,
        clientCode: null,
        clientName: clientNameById.get(clientId) ?? fallbackName ?? "Cliente SGIC",
        nativeClientId: clientId,
        sourceRecordId: clientSourceRecordId ?? clientId,
      };
    }

    const stagingClient = clientSourceRecordId
      ? stagingClientBySourceRecordId.get(clientSourceRecordId)
      : null;

    if (stagingClient?.nativeClientId) {
      return {
        activeLocationsCount:
          locationsByClient.get(stagingClient.nativeClientId) ??
          stagingClient.activeLocationsCount,
        clientCode: stagingClient.clientCode,
        clientName:
          clientNameById.get(stagingClient.nativeClientId) ?? stagingClient.clientName,
        nativeClientId: stagingClient.nativeClientId,
        sourceRecordId: stagingClient.sourceRecordId,
      };
    }

    return {
      activeLocationsCount: stagingClient?.activeLocationsCount ?? 0,
      clientCode: stagingClient?.clientCode ?? null,
      clientName: stagingClient?.clientName ?? fallbackName ?? "Cliente FileMaker",
      nativeClientId: null,
      sourceRecordId:
        stagingClient?.sourceRecordId ??
        clientSourceRecordId ??
        clientId ??
        fallbackName ??
        "filemaker",
    };
  };

  for (const location of locations) {
    locationsByClient.set(
      location.client_id,
      (locationsByClient.get(location.client_id) ?? 0) + 1
    );
  }

  for (const stagingClient of stagingClients) {
    const nativeClientId =
      stagingClient.client_id ??
      nativeClientIdByNormalizedName.get(normalizeLookupValue(stagingClient.name)) ??
      null;

    stagingClientBySourceRecordId.set(stagingClient.source_record_id, {
      activeLocationsCount: stagingClient.active_locations_count ?? 0,
      clientCode: stagingClient.client_code ?? null,
      clientName: stagingClient.name,
      nativeClientId,
      sourceRecordId: stagingClient.source_record_id,
    });

    if (nativeClientId) {
      stagingSignalsByClient.add(nativeClientId);
    } else if (normalizeStatus(stagingClient.status) !== "inactive") {
      getOrCreateStagingOnlyClient(
        stagingClient.source_record_id,
        stagingClient.name,
        stagingClient.client_code,
        stagingClient.active_locations_count
      );
    }
  }

  for (const serviceLine of serviceLines) {
    nativeServicesByClient.set(
      serviceLine.client_id,
      (nativeServicesByClient.get(serviceLine.client_id) ?? 0) + 1
    );

    const serviceAreaLabel =
      serviceLine.section?.trim() ||
      serviceLine.billing_phase?.trim() ||
      "Servizi senza cluster";

    addToSetMap(nativeServiceAreasByClient, serviceLine.client_id, serviceAreaLabel);
    addCoverageRow(
      serviceAreaLabel,
      Number(serviceLine.total_price ?? 0),
      serviceLine.client_id,
      "native",
      serviceLine.is_recurring
    );
  }

  for (const person of personnel) {
    if (!person.is_active || !person.client_id) continue;

    nativeActivePersonnelByClient.set(
      person.client_id,
      (nativeActivePersonnelByClient.get(person.client_id) ?? 0) + 1
    );
  }

  for (const record of trainingRecords) {
    const bucket = trainingRecordsByPersonnel.get(record.personnel_id) ?? [];
    bucket.push(record);
    trainingRecordsByPersonnel.set(record.personnel_id, bucket);
  }

  for (const audit of audits) {
    if (!audit.client_id) continue;

    if (
      audit.scheduled_date &&
      (!lastAuditDateByClient.has(audit.client_id) ||
        compareDateStrings(
          lastAuditDateByClient.get(audit.client_id) as string,
          audit.scheduled_date
        ) < 0)
    ) {
      lastAuditDateByClient.set(audit.client_id, audit.scheduled_date);
    }

    const normalizedStatus = normalizeStatus(audit.status);
    if (audit.scheduled_date && !["completed", "cancelled", "closed"].includes(normalizedStatus)) {
      const dueStatus = classifyDueDate(audit.scheduled_date, todayKey, soonLimitKey);
      dueItems.push({
        clientId: audit.client_id,
        clientName: clientNameById.get(audit.client_id) ?? "Cliente non assegnato",
        dueDate: audit.scheduled_date,
        href: "/audits",
        label: audit.status ? `Audit ${audit.status}` : "Audit pianificato",
        priority: null,
        source: "sgic",
        status: dueStatus,
        type: "audit",
      });
    }
  }

  for (const nc of nonConformities) {
    if (!nc.audit_id || isClosedLikeStatus(nc.status)) continue;
    const audit = auditById.get(nc.audit_id);
    const clientId = audit?.client_id;
    if (!clientId) continue;

    openNcByClient.set(clientId, (openNcByClient.get(clientId) ?? 0) + 1);
    if (normalizeStatus(nc.severity) === "critical") {
      criticalNcByClient.set(clientId, (criticalNcByClient.get(clientId) ?? 0) + 1);
    }
  }

  for (const action of correctiveActions) {
    if (isClosedLikeStatus(action.status)) continue;
    const deadline = action.target_completion_date;
    if (!deadline || deadline >= todayKey) continue;

    const nc = ncById.get(action.non_conformity_id);
    const clientId = nc?.audit_id ? auditById.get(nc.audit_id)?.client_id : null;
    if (!clientId) continue;

    overdueActionsByClient.set(
      clientId,
      (overdueActionsByClient.get(clientId) ?? 0) + 1
    );
  }

  for (const deadline of deadlines) {
    nativeDeadlineCountByClient.set(
      deadline.client_id,
      (nativeDeadlineCountByClient.get(deadline.client_id) ?? 0) + 1
    );

    if (normalizeStatus(deadline.status) !== "open") continue;

    const dueStatus = classifyDueDate(deadline.due_date, todayKey, soonLimitKey);
    if (dueStatus === "overdue") {
      overdueItemsByClient.set(
        deadline.client_id,
        (overdueItemsByClient.get(deadline.client_id) ?? 0) + 1
      );
    }

    dueItems.push({
      clientId: deadline.client_id,
      clientName: clientNameById.get(deadline.client_id) ?? "Cliente non assegnato",
      dueDate: deadline.due_date,
      href: deadline.client_id ? `/clients/${deadline.client_id}` : "/clients",
      label: deadline.title,
      priority: deadline.priority,
      source: "sgic",
      status: dueStatus,
      type: "deadline",
    });
  }

  for (const task of tasks) {
    if (isClosedLikeStatus(task.status) || !task.due_date) continue;

    const dueStatus = classifyDueDate(task.due_date, todayKey, soonLimitKey);
    if (dueStatus === "overdue") {
      overdueItemsByClient.set(
        task.client_id,
        (overdueItemsByClient.get(task.client_id) ?? 0) + 1
      );
    }

    dueItems.push({
      clientId: task.client_id,
      clientName: clientNameById.get(task.client_id) ?? "Cliente non assegnato",
      dueDate: task.due_date,
      href: task.client_id ? `/clients/${task.client_id}` : "/clients",
      label: task.title,
      priority: task.priority,
      source: "sgic",
      status: dueStatus,
      type: "task",
    });
  }

  for (const contract of contracts) {
    nativeContractCountByClient.set(
      contract.client_id,
      (nativeContractCountByClient.get(contract.client_id) ?? 0) + 1
    );

    const contractStatus = normalizeStatus(contract.status);
    if (contractStatus === "expired" || contractStatus === "cancelled") continue;

    const dueDate = contract.renewal_date ?? contract.end_date;
    if (!dueDate || dueDate > contractLimitKey) continue;

    const dueStatus = classifyDueDate(dueDate, todayKey, soonLimitKey);
    if (dueStatus === "overdue") {
      overdueItemsByClient.set(
        contract.client_id,
        (overdueItemsByClient.get(contract.client_id) ?? 0) + 1
      );
    }

    dueItems.push({
      clientId: contract.client_id,
      clientName: clientNameById.get(contract.client_id) ?? "Cliente non assegnato",
      dueDate,
      href: contract.client_id ? `/clients/${contract.client_id}` : "/clients",
      label: contract.renewal_date ? "Rinnovo contratto" : "Fine contratto",
      priority: null,
      source: "sgic",
      status: dueStatus,
      type: "contract",
    });
  }

  for (const document of documents) {
    if (!document.client_id || !document.expiry_date) continue;

    const dueStatus = classifyDueDate(document.expiry_date, todayKey, soonLimitKey);
    if (dueStatus === "overdue") {
      overdueItemsByClient.set(
        document.client_id,
        (overdueItemsByClient.get(document.client_id) ?? 0) + 1
      );
    }

    if (document.expiry_date <= soonLimitKey) {
      expiringDocumentsByClient.set(
        document.client_id,
        (expiringDocumentsByClient.get(document.client_id) ?? 0) + 1
      );

      dueItems.push({
        clientId: document.client_id,
        clientName: clientNameById.get(document.client_id) ?? "Cliente non assegnato",
        dueDate: document.expiry_date,
        href: document.client_id ? `/clients/${document.client_id}` : "/clients",
        label: document.title ?? "Documento in scadenza",
        priority: document.category,
        source: "sgic",
        status: dueStatus,
        type: "document",
      });
    }
  }

  for (const serviceLine of stagingServiceLines) {
    if (isClosedLikeStatus(serviceLine.status)) continue;

    const resolvedClient = resolveStagingClient(
      serviceLine.client_id,
      serviceLine.client_source_record_id,
      serviceLine.service_name
    );
    const serviceAreaLabel =
      serviceLine.service_area?.trim() ||
      serviceLine.service_name.trim() ||
      "Servizi FileMaker";
    const annualValue = Number(serviceLine.annual_value ?? 0);

    if (resolvedClient.nativeClientId) {
      stagingSignalsByClient.add(resolvedClient.nativeClientId);

      if ((nativeServicesByClient.get(resolvedClient.nativeClientId) ?? 0) > 0) {
        continue;
      }

      fallbackServicesByClient.set(
        resolvedClient.nativeClientId,
        (fallbackServicesByClient.get(resolvedClient.nativeClientId) ?? 0) + 1
      );
      addToSetMap(
        fallbackServiceAreasByClient,
        resolvedClient.nativeClientId,
        serviceAreaLabel
      );
      addCoverageRow(
        serviceAreaLabel,
        annualValue,
        resolvedClient.nativeClientId,
        "staging",
        isRecurringCadence(serviceLine.cadence)
      );
    } else {
      const stagingClient = getOrCreateStagingOnlyClient(
        resolvedClient.sourceRecordId,
        resolvedClient.clientName,
        resolvedClient.clientCode,
        resolvedClient.activeLocationsCount
      );

      stagingClient.serviceLines += 1;
      stagingClient.annualValue += annualValue;
      stagingClient.serviceAreas.add(serviceAreaLabel);

      addCoverageRow(
        serviceAreaLabel,
        annualValue,
        `staging:${resolvedClient.sourceRecordId}`,
        "staging",
        isRecurringCadence(serviceLine.cadence)
      );
    }
  }

  let stagedAssignments = 0;
  let stagedPlannedHours = 0;
  const stagedClientsCovered = new Set<string>();

  for (const capacityRow of stagingCapacity) {
    if (isClosedLikeStatus(capacityRow.status)) continue;
    if (capacityRow.period_end && capacityRow.period_end < todayKey) continue;

    const resolvedClient = resolveStagingClient(
      capacityRow.client_id,
      capacityRow.client_source_record_id,
      capacityRow.owner_name
    );
    const plannedHours = Number(capacityRow.planned_hours ?? 0);

    stagedAssignments += 1;
    stagedPlannedHours += plannedHours;

    if (resolvedClient.nativeClientId) {
      stagingSignalsByClient.add(resolvedClient.nativeClientId);
      stagedClientsCovered.add(resolvedClient.nativeClientId);

      if ((nativeActivePersonnelByClient.get(resolvedClient.nativeClientId) ?? 0) === 0) {
        fallbackPresidioByClient.set(
          resolvedClient.nativeClientId,
          (fallbackPresidioByClient.get(resolvedClient.nativeClientId) ?? 0) + 1
        );
      }
    } else {
      stagedClientsCovered.add(`staging:${resolvedClient.sourceRecordId}`);
      const stagingClient = getOrCreateStagingOnlyClient(
        resolvedClient.sourceRecordId,
        resolvedClient.clientName,
        resolvedClient.clientCode,
        resolvedClient.activeLocationsCount
      );
      stagingClient.plannedAssignments += 1;
      stagingClient.plannedHours += plannedHours;
    }
  }

  for (const deadline of stagingDeadlines) {
    if (isClosedLikeStatus(deadline.status)) continue;

    const resolvedClient = resolveStagingClient(
      deadline.client_id,
      deadline.client_source_record_id,
      deadline.title
    );
    const dueStatus = classifyDueDate(deadline.due_date, todayKey, soonLimitKey);

    if (resolvedClient.nativeClientId) {
      stagingSignalsByClient.add(resolvedClient.nativeClientId);

      if ((nativeDeadlineCountByClient.get(resolvedClient.nativeClientId) ?? 0) > 0) {
        continue;
      }

      if (dueStatus === "overdue") {
        overdueItemsByClient.set(
          resolvedClient.nativeClientId,
          (overdueItemsByClient.get(resolvedClient.nativeClientId) ?? 0) + 1
        );
      }

      dueItems.push({
        clientId: resolvedClient.nativeClientId,
        clientName: resolvedClient.clientName,
        dueDate: deadline.due_date,
        href: `/clients/${resolvedClient.nativeClientId}`,
        label: deadline.title,
        priority: deadline.priority,
        source: "staging",
        status: dueStatus,
        type: "deadline",
      });
    } else {
      const stagingClient = getOrCreateStagingOnlyClient(
        resolvedClient.sourceRecordId,
        resolvedClient.clientName,
        resolvedClient.clientCode,
        resolvedClient.activeLocationsCount
      );

      stagingClient.deadlineDueCount += 1;
      if (dueStatus === "overdue") {
        stagingClient.overdueItems += 1;
      }

      dueItems.push({
        clientId: null,
        clientName: stagingClient.clientName,
        dueDate: deadline.due_date,
        href: "/management",
        label: deadline.title,
        priority: deadline.priority,
        source: "staging",
        status: dueStatus,
        type: "deadline",
      });
    }
  }

  for (const contract of stagingContracts) {
    const contractStatus = normalizeStatus(contract.status);
    if (contractStatus === "expired" || contractStatus === "cancelled") continue;

    const dueDate = contract.renewal_date ?? contract.end_date;
    if (!dueDate || dueDate > contractLimitKey) continue;

    const resolvedClient = resolveStagingClient(
      contract.client_id,
      contract.client_source_record_id
    );
    const dueStatus = classifyDueDate(dueDate, todayKey, soonLimitKey);

    if (resolvedClient.nativeClientId) {
      stagingSignalsByClient.add(resolvedClient.nativeClientId);

      if ((nativeContractCountByClient.get(resolvedClient.nativeClientId) ?? 0) > 0) {
        continue;
      }

      if (dueStatus === "overdue") {
        overdueItemsByClient.set(
          resolvedClient.nativeClientId,
          (overdueItemsByClient.get(resolvedClient.nativeClientId) ?? 0) + 1
        );
      }

      dueItems.push({
        clientId: resolvedClient.nativeClientId,
        clientName: resolvedClient.clientName,
        dueDate,
        href: `/clients/${resolvedClient.nativeClientId}`,
        label: contract.renewal_date ? "Rinnovo contratto FileMaker" : "Fine contratto FileMaker",
        priority: null,
        source: "staging",
        status: dueStatus,
        type: "contract",
      });
    } else {
      const stagingClient = getOrCreateStagingOnlyClient(
        resolvedClient.sourceRecordId,
        resolvedClient.clientName,
        resolvedClient.clientCode,
        resolvedClient.activeLocationsCount
      );

      stagingClient.contractDueCount += 1;
      if (dueStatus === "overdue") {
        stagingClient.overdueItems += 1;
      }

      dueItems.push({
        clientId: null,
        clientName: stagingClient.clientName,
        dueDate,
        href: "/management",
        label: contract.renewal_date ? "Rinnovo contratto FileMaker" : "Fine contratto FileMaker",
        priority: null,
        source: "staging",
        status: dueStatus,
        type: "contract",
      });
    }
  }

  const activePersonnel = personnel.filter((person) => person.is_active);
  let expiringTrainingCount = 0;
  let expiredTrainingCount = 0;

  for (const person of activePersonnel) {
    const summary = getTrainingWindowSummary(
      trainingRecordsByPersonnel.get(person.id) ?? [],
      45
    );

    if (summary.expiredCount > 0) {
      expiredTrainingCount += 1;
    } else if (summary.expiringSoonCount > 0) {
      expiringTrainingCount += 1;
    }
  }

  const coverageRows = Array.from(coverageRowsMap.entries())
    .map<ManagementCoverageRow>(([label, value]) => {
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

  const nativePortfolioRows = activeClients.map<ManagementPortfolioRow>((client) => {
    const nativeServiceLinesCount = nativeServicesByClient.get(client.id) ?? 0;
    const fallbackServiceLinesCount = fallbackServicesByClient.get(client.id) ?? 0;
    const serviceLinesCount =
      nativeServiceLinesCount > 0 ? nativeServiceLinesCount : fallbackServiceLinesCount;
    const serviceAreasCount =
      nativeServiceLinesCount > 0
        ? nativeServiceAreasByClient.get(client.id)?.size ?? 0
        : fallbackServiceAreasByClient.get(client.id)?.size ?? 0;
    const nativePersonnelCount = nativeActivePersonnelByClient.get(client.id) ?? 0;
    const fallbackPresidioCount = fallbackPresidioByClient.get(client.id) ?? 0;
    const activePersonnelCount =
      nativePersonnelCount > 0 ? nativePersonnelCount : fallbackPresidioCount;
    const openNCs = openNcByClient.get(client.id) ?? 0;
    const criticalNCs = criticalNcByClient.get(client.id) ?? 0;
    const overdueActions = overdueActionsByClient.get(client.id) ?? 0;
    const overdueItems = overdueItemsByClient.get(client.id) ?? 0;
    const expiringDocuments = expiringDocumentsByClient.get(client.id) ?? 0;
    const usesStagingFallback =
      fallbackServiceLinesCount > 0 || fallbackPresidioCount > 0;

    const riskScore =
      criticalNCs * 6 +
      openNCs * 2 +
      overdueActions * 4 +
      overdueItems * 3 +
      expiringDocuments +
      (serviceLinesCount === 0 ? 3 : 0) +
      (activePersonnelCount === 0 ? 2 : 0);

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
      serviceLinesCount === 0
        ? "uncovered"
        : serviceLinesCount < 3
          ? "partial"
          : "covered";

    return {
      activeLocations: locationsByClient.get(client.id) ?? 0,
      activePersonnel: activePersonnelCount,
      attentionReasons,
      clientHref: `/clients/${client.id}`,
      clientId: client.id,
      clientKey: client.id,
      clientName: client.name,
      coverageStatus,
      expiringDocuments,
      lastAuditDate: lastAuditDateByClient.get(client.id) ?? null,
      openNCs,
      overdueActions,
      overdueItems,
      riskScore,
      serviceAreas: serviceAreasCount,
      serviceLines: serviceLinesCount,
      source: stagingSignalsByClient.has(client.id) ? "merged" : "sgic",
    };
  });

  const stagingPortfolioRows = Array.from(stagingOnlyClients.values()).map<ManagementPortfolioRow>(
    (client) => {
      const riskScore =
        client.overdueItems * 3 +
        (client.serviceLines === 0 ? 3 : 0) +
        (client.plannedAssignments === 0 ? 2 : 0);

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
        client.serviceLines === 0
          ? "uncovered"
          : client.serviceLines < 3
            ? "partial"
            : "covered";

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
        riskScore,
        serviceAreas: client.serviceAreas.size,
        serviceLines: client.serviceLines,
        source: "staging",
      };
    }
  );

  const portfolioRows = [...nativePortfolioRows, ...stagingPortfolioRows].sort((left, right) => {
    if (right.riskScore !== left.riskScore) {
      return right.riskScore - left.riskScore;
    }

    return left.clientName.localeCompare(right.clientName, "it");
  });

  const dueItemsByKey = new Map<string, ManagementDueItem>();
  for (const item of dueItems) {
    const key = `${item.type}:${item.clientId ?? item.clientName}:${item.label}:${item.dueDate}`;
    if (!dueItemsByKey.has(key)) {
      dueItemsByKey.set(key, item);
    }
  }

  const sortedDueItems = Array.from(dueItemsByKey.values())
    .sort((left, right) => compareDateStrings(left.dueDate, right.dueDate))
    .slice(0, 12);

  const nativeCoveredClients = activeClients.filter((client) => {
    const nativeServiceLinesCount = nativeServicesByClient.get(client.id) ?? 0;
    const fallbackServiceLinesCount = fallbackServicesByClient.get(client.id) ?? 0;
    return nativeServiceLinesCount > 0 || fallbackServiceLinesCount > 0;
  }).length;
  const stagingCoveredClients = stagingPortfolioRows.filter((row) => row.serviceLines > 0).length;
  const stagingUnmappedClients = stagingPortfolioRows.length;
  const totalPortfolioClients = activeClients.length + stagingUnmappedClients;
  const coveredClients = nativeCoveredClients + stagingCoveredClients;
  const attentionClients = portfolioRows.filter((row) => row.riskScore >= 6).length;
  const upcomingItemsCount = sortedDueItems.filter(
    (item) => item.dueDate >= todayKey && item.dueDate <= soonLimitKey
  ).length;
  const clientsWithoutPersonnel = portfolioRows.filter(
    (row) => row.activePersonnel === 0
  ).length;
  const effectiveCoverageUnits = Math.max(activePersonnel.length, stagedAssignments);
  const ratioClientsPerPerson =
    effectiveCoverageUnits > 0
      ? Number((totalPortfolioClients / effectiveCoverageUnits).toFixed(1))
      : null;

  const hasCoverageSignal = coverageRows.some((row) => row.serviceLineCount > 0);
  const stagingServiceLineCount = stagingServiceLines.filter(
    (serviceLine) => !isClosedLikeStatus(serviceLine.status)
  ).length;
  const stagingDeadlineCount = stagingDeadlines.filter(
    (deadline) => !isClosedLikeStatus(deadline.status)
  ).length;
  const stagingContractCount = stagingContracts.filter((contract) => {
    const contractStatus = normalizeStatus(contract.status);
    return contractStatus !== "expired" && contractStatus !== "cancelled";
  }).length;
  const mappedStagingClientCount = Array.from(stagingClientBySourceRecordId.values()).filter(
    (client) => Boolean(client.nativeClientId)
  ).length;

  const metrics: ManagementMetric[] = [
    {
      href: "/clients",
      hint:
        stagingUnmappedClients > 0
          ? `${activeClients.length} clienti SGIC + ${stagingUnmappedClients} importati da FileMaker`
          : `${nativeCoveredClients}/${activeClients.length} clienti con perimetro direzionale letto`,
      label: "Portafoglio attivo",
      tone: totalPortfolioClients > 0 ? "default" : "warning",
      value: String(totalPortfolioClients),
    },
    {
      href: "/clients",
      hint: hasCoverageSignal
        ? `${Math.max(totalPortfolioClients - coveredClients, 0)} clienti senza copertura strutturata${stagingUnmappedClients > 0 ? ` · ${stagingUnmappedClients} solo staging` : ""}`
        : "Service lines non ancora disponibili nel perimetro letto",
      label: "Copertura servizi",
      tone:
        optionalTables.has("client_service_lines") ||
        Math.max(totalPortfolioClients - coveredClients, 0) > 0
          ? "warning"
          : "default",
      value:
        hasCoverageSignal && totalPortfolioClients > 0
          ? `${coveredClients}/${totalPortfolioClients}`
          : integrationTables.has("management_service_lines_staging")
            ? "N/D"
            : `0/${totalPortfolioClients}`,
    },
    {
      href: "/non-conformities",
      hint: `${portfolioRows.reduce((sum, row) => sum + row.openNCs, 0)} NC aperte nel perimetro`,
      label: "Clienti ad alta attenzione",
      tone: attentionClients > 0 ? "danger" : "default",
      value: String(attentionClients),
    },
    {
      href: "/clients",
      hint: `${portfolioRows.reduce((sum, row) => sum + row.overdueItems, 0)} oltre termine + ${upcomingItemsCount} entro 30 giorni`,
      label: "Scadenze trasversali",
      tone: portfolioRows.some((row) => row.overdueItems > 0) ? "danger" : "warning",
      value: String(upcomingItemsCount),
    },
    {
      href: "/personnel",
      hint:
        effectiveCoverageUnits === 0
          ? "Presidio non ancora configurato"
          : activePersonnel.length > 0
            ? `${ratioClientsPerPerson} clienti per presidio attivo`
            : `${stagedPlannedHours}h pianificate via staging`,
      label: "Capacita interna",
      tone:
        clientsWithoutPersonnel > 0 || expiredTrainingCount > 0
          ? "warning"
          : "default",
      value: String(effectiveCoverageUnits),
    },
  ];

  return {
    capacity: {
      activePersonnel: activePersonnel.length,
      clientsWithoutPersonnel,
      effectiveCoverageUnits,
      expiringTrainingCount,
      expiredTrainingCount,
      linkedPersonnel: activePersonnel.filter((person) => Boolean(person.client_id)).length,
      plannedHours: stagedPlannedHours,
      ratioClientsPerPerson,
      stagedAssignments,
      stagedClientsCovered: stagedClientsCovered.size,
      stagedUnmappedClients: stagingUnmappedClients,
    },
    coverageRows,
    dueItems: sortedDueItems,
    generatedAt: new Date().toISOString(),
    metrics,
    organizationName,
    portfolioRows: portfolioRows.slice(0, 8),
    sourceStatus: {
      lastSync: latestSync,
      missingIntegrationTables: Array.from(integrationTables).sort(),
      missingOperationalTables: Array.from(optionalTables).sort(),
      mode:
        integrationTables.size === 0 ? "sgic-plus-staging" : "sgic-native",
      stagingSnapshot: {
        capacityAssignments: stagedAssignments,
        clientCount: stagingClients.length,
        contractCount: stagingContractCount,
        deadlineCount: stagingDeadlineCount,
        mappedClientCount: mappedStagingClientCount,
        plannedHours: stagedPlannedHours,
        serviceLineCount: stagingServiceLineCount,
        unmappedClientCount: stagingUnmappedClients,
      },
    },
  };
}
