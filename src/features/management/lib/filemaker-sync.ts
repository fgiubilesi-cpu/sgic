import { createAdminClient } from "@/lib/supabase/admin";
import {
  fileMakerManagementSyncSchema,
  type FileMakerManagementSyncInput,
} from "@/features/management/schemas/filemaker-sync-schema";

type SyncBucketCount = {
  capacity: number;
  clients: number;
  contracts: number;
  deadlines: number;
  service_lines: number;
};

type ClientMatchReason = "existing" | "explicit" | "name" | "unresolved" | "vat";

type NativeClientRow = {
  id: string;
  name: string;
  vat_number: string | null;
};

type ExistingStagingClientRow = {
  client_id: string | null;
  name: string;
  source_record_id: string;
  vat_number: string | null;
};

type ClientResolution = {
  clientId: string | null;
  reason: ClientMatchReason;
};

type ClientResolutionContext = {
  clientIdByName: Map<string, string | null>;
  clientIdByVatNumber: Map<string, string | null>;
  existingStagingBySourceRecordId: Map<string, ExistingStagingClientRow>;
  validClientIds: Set<string>;
};

type ReconciliationSummary = {
  dependentRowsLinked: number;
  dependentRowsUnlinked: number;
  invalidExplicitClientIds: number;
  matchedByExistingStaging: number;
  matchedByExplicitId: number;
  matchedByName: number;
  matchedByVatNumber: number;
  matchedClients: number;
  unresolvedClients: number;
};

export type FileMakerSyncResult = {
  counts: SyncBucketCount;
  dryRun: boolean;
  mode: string;
  organizationId: string;
  reconciliation: ReconciliationSummary;
  runId: string | null;
  scope: string;
  sourceSystem: string;
  written: number;
};

function buildCounts(input: FileMakerManagementSyncInput): SyncBucketCount {
  return {
    capacity: input.capacity.length,
    clients: input.clients.length,
    contracts: input.contracts.length,
    deadlines: input.deadlines.length,
    service_lines: input.service_lines.length,
  };
}

function totalCount(counts: SyncBucketCount) {
  return (
    counts.clients +
    counts.service_lines +
    counts.contracts +
    counts.deadlines +
    counts.capacity
  );
}

function normalizeLookupValue(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function normalizeVatNumber(value: string | null | undefined) {
  const normalized = (value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();

  if (!normalized) return "";
  if (normalized.startsWith("IT") && normalized.length > 11) {
    return normalized.slice(2);
  }

  return normalized;
}

function registerUniqueLookup(map: Map<string, string | null>, key: string, clientId: string) {
  if (!key) return;

  if (!map.has(key)) {
    map.set(key, clientId);
    return;
  }

  if (map.get(key) !== clientId) {
    map.set(key, null);
  }
}

async function buildClientResolutionContext(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  sourceSystem: string
): Promise<ClientResolutionContext> {
  const [{ data: nativeClients, error: nativeClientsError }, { data: stagingClients, error: stagingClientsError }] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name, vat_number")
        .eq("organization_id", organizationId),
      supabase
        .from("management_clients_staging")
        .select("source_record_id, client_id, name, vat_number")
        .eq("organization_id", organizationId)
        .eq("source_system", sourceSystem),
    ]);

  if (nativeClientsError) {
    throw new Error("Unable to resolve SGIC clients for management sync.");
  }

  if (stagingClientsError) {
    throw new Error("Unable to resolve existing staging clients for management sync.");
  }

  const clientIdByName = new Map<string, string | null>();
  const clientIdByVatNumber = new Map<string, string | null>();
  const validClientIds = new Set<string>();

  for (const client of (nativeClients ?? []) as NativeClientRow[]) {
    validClientIds.add(client.id);
    registerUniqueLookup(clientIdByName, normalizeLookupValue(client.name), client.id);

    const normalizedVatNumber = normalizeVatNumber(client.vat_number);
    if (normalizedVatNumber) {
      registerUniqueLookup(clientIdByVatNumber, normalizedVatNumber, client.id);
    }
  }

  return {
    clientIdByName,
    clientIdByVatNumber,
    existingStagingBySourceRecordId: new Map(
      ((stagingClients ?? []) as ExistingStagingClientRow[]).map((row) => [
        row.source_record_id,
        row,
      ])
    ),
    validClientIds,
  };
}

function createEmptyReconciliationSummary(): ReconciliationSummary {
  return {
    dependentRowsLinked: 0,
    dependentRowsUnlinked: 0,
    invalidExplicitClientIds: 0,
    matchedByExistingStaging: 0,
    matchedByExplicitId: 0,
    matchedByName: 0,
    matchedByVatNumber: 0,
    matchedClients: 0,
    unresolvedClients: 0,
  };
}

function resolveClientReference(
  context: ClientResolutionContext,
  input: {
    clientId?: string | null;
    clientName?: string | null;
    clientSourceRecordId?: string | null;
    vatNumber?: string | null;
  }
): ClientResolution {
  const existingStagingRow = input.clientSourceRecordId
    ? context.existingStagingBySourceRecordId.get(input.clientSourceRecordId)
    : undefined;

  if (input.clientId && context.validClientIds.has(input.clientId)) {
    return {
      clientId: input.clientId,
      reason: "explicit",
    };
  }

  if (
    existingStagingRow?.client_id &&
    context.validClientIds.has(existingStagingRow.client_id)
  ) {
    return {
      clientId: existingStagingRow.client_id,
      reason: "existing",
    };
  }

  const normalizedVatNumber = normalizeVatNumber(
    input.vatNumber ?? existingStagingRow?.vat_number
  );
  const vatMatch = normalizedVatNumber
    ? context.clientIdByVatNumber.get(normalizedVatNumber)
    : null;

  if (vatMatch) {
    return {
      clientId: vatMatch,
      reason: "vat",
    };
  }

  const normalizedClientName = normalizeLookupValue(
    input.clientName ?? existingStagingRow?.name
  );
  const nameMatch = normalizedClientName
    ? context.clientIdByName.get(normalizedClientName)
    : null;

  if (nameMatch) {
    return {
      clientId: nameMatch,
      reason: "name",
    };
  }

  return {
    clientId: null,
    reason: "unresolved",
  };
}

function applyClientResolutionStats(
  summary: ReconciliationSummary,
  resolution: ClientResolution,
  usedInvalidExplicitClientId: boolean
) {
  if (usedInvalidExplicitClientId) {
    summary.invalidExplicitClientIds += 1;
  }

  if (resolution.reason === "explicit") {
    summary.matchedByExplicitId += 1;
    summary.matchedClients += 1;
    return;
  }

  if (resolution.reason === "existing") {
    summary.matchedByExistingStaging += 1;
    summary.matchedClients += 1;
    return;
  }

  if (resolution.reason === "vat") {
    summary.matchedByVatNumber += 1;
    summary.matchedClients += 1;
    return;
  }

  if (resolution.reason === "name") {
    summary.matchedByName += 1;
    summary.matchedClients += 1;
    return;
  }

  summary.unresolvedClients += 1;
}

async function resolveOrganizationId(
  supabase: ReturnType<typeof createAdminClient>,
  input: FileMakerManagementSyncInput
) {
  if (input.organization_id) {
    const { data, error } = await supabase
      .from("organizations")
      .select("id")
      .eq("id", input.organization_id)
      .single();

    if (error || !data) {
      throw new Error("Organization not found for provided organization_id.");
    }

    return data.id as string;
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", input.organization_slug as string)
    .single();

  if (error || !data) {
    throw new Error("Organization not found for provided organization_slug.");
  }

  return data.id as string;
}

async function insertSyncRun(
  supabase: ReturnType<typeof createAdminClient>,
  organizationId: string,
  input: FileMakerManagementSyncInput,
  counts: SyncBucketCount
) {
  const { data, error } = await supabase
    .from("management_sync_runs")
    .insert({
      organization_id: organizationId,
      payload: {
        counts,
        dry_run: input.dry_run,
      },
      records_read: totalCount(counts),
      source_system: input.source_system,
      status: "running",
      sync_mode: input.sync_mode,
      sync_scope: input.sync_scope,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error("Unable to create management sync run.");
  }

  return data.id as string;
}

async function finalizeSyncRun(
  supabase: ReturnType<typeof createAdminClient>,
  runId: string,
  input: {
    errorSummary?: string;
    recordsWritten: number;
    status: "failed" | "success" | "warning";
  }
) {
  const { error } = await supabase
    .from("management_sync_runs")
    .update({
      error_summary: input.errorSummary ?? null,
      finished_at: new Date().toISOString(),
      records_written: input.recordsWritten,
      status: input.status,
    })
    .eq("id", runId);

  if (error) {
    throw new Error("Unable to finalize management sync run.");
  }
}

async function upsertRows(
  supabase: ReturnType<typeof createAdminClient>,
  tableName:
    | "management_capacity_staging"
    | "management_clients_staging"
    | "management_contracts_staging"
    | "management_deadlines_staging"
    | "management_service_lines_staging",
  rows: Record<string, unknown>[]
) {
  if (rows.length === 0) {
    return 0;
  }

  const { error } = await supabase
    .from(tableName)
    .upsert(rows, {
      ignoreDuplicates: false,
      onConflict: "organization_id,source_system,source_record_id",
    });

  if (error) {
    throw new Error(`Unable to upsert ${tableName}.`);
  }

  return rows.length;
}

export async function ingestFileMakerManagementSync(
  payload: unknown
): Promise<FileMakerSyncResult> {
  const input = fileMakerManagementSyncSchema.parse(payload);
  const counts = buildCounts(input);
  const recordsRead = totalCount(counts);
  const supabase = createAdminClient();
  const organizationId = await resolveOrganizationId(supabase, input);
  const resolutionContext = await buildClientResolutionContext(
    supabase,
    organizationId,
    input.source_system
  );
  const reconciliation = createEmptyReconciliationSummary();
  const resolvedClientIdBySourceRecordId = new Map<string, string | null>();

  for (const client of input.clients) {
    const usedInvalidExplicitClientId = Boolean(
      client.client_id && !resolutionContext.validClientIds.has(client.client_id)
    );
    const resolution = resolveClientReference(resolutionContext, {
      clientId: client.client_id ?? null,
      clientName: client.name,
      clientSourceRecordId: client.source_record_id,
      vatNumber: client.vat_number ?? null,
    });

    resolvedClientIdBySourceRecordId.set(client.source_record_id, resolution.clientId);
    applyClientResolutionStats(reconciliation, resolution, usedInvalidExplicitClientId);

    if (resolution.clientId) {
      const existingRow =
        resolutionContext.existingStagingBySourceRecordId.get(client.source_record_id);
      resolutionContext.existingStagingBySourceRecordId.set(client.source_record_id, {
        client_id: resolution.clientId,
        name: client.name,
        source_record_id: client.source_record_id,
        vat_number: client.vat_number ?? existingRow?.vat_number ?? null,
      });
    }
  }

  const resolveDependentClientId = (inputRow: {
    client_id?: string | null;
    client_source_record_id?: string | null;
  }) => {
    if (inputRow.client_id && resolutionContext.validClientIds.has(inputRow.client_id)) {
      reconciliation.dependentRowsLinked += 1;
      return inputRow.client_id;
    }

    const resolvedClientId =
      (inputRow.client_source_record_id
        ? resolvedClientIdBySourceRecordId.get(inputRow.client_source_record_id)
        : undefined) ??
      resolveClientReference(resolutionContext, {
        clientId: inputRow.client_id ?? null,
        clientSourceRecordId: inputRow.client_source_record_id ?? null,
      }).clientId;

    if (resolvedClientId) {
      reconciliation.dependentRowsLinked += 1;
      return resolvedClientId;
    }

    reconciliation.dependentRowsUnlinked += 1;
    return null;
  };

  const resolvedServiceLines = input.service_lines.map((item) => ({
    item,
    resolvedClientId: resolveDependentClientId(item),
  }));
  const resolvedContracts = input.contracts.map((item) => ({
    item,
    resolvedClientId: resolveDependentClientId(item),
  }));
  const resolvedDeadlines = input.deadlines.map((item) => ({
    item,
    resolvedClientId: resolveDependentClientId(item),
  }));
  const resolvedCapacity = input.capacity.map((item) => ({
    item,
    resolvedClientId: resolveDependentClientId(item),
  }));

  if (input.dry_run) {
    return {
      counts,
      dryRun: true,
      mode: input.sync_mode,
      organizationId,
      reconciliation,
      runId: null,
      scope: input.sync_scope,
      sourceSystem: input.source_system,
      written: recordsRead,
    };
  }

  const runId = await insertSyncRun(supabase, organizationId, input, counts);
  const syncedAt = new Date().toISOString();

  try {
    let written = 0;

    written += await upsertRows(
      supabase,
      "management_clients_staging",
      input.clients.map((item) => ({
        account_owner: item.account_owner ?? null,
        active_locations_count: item.active_locations_count ?? null,
        client_code: item.client_code ?? null,
        client_id: resolvedClientIdBySourceRecordId.get(item.source_record_id) ?? null,
        name: item.name,
        organization_id: organizationId,
        payload: item.payload ?? {},
        service_model: item.service_model ?? null,
        source_record_id: item.source_record_id,
        source_system: input.source_system,
        status: item.status ?? null,
        sync_run_id: runId,
        synced_at: syncedAt,
        vat_number: item.vat_number ?? null,
      }))
    );

    written += await upsertRows(
      supabase,
      "management_service_lines_staging",
      resolvedServiceLines.map(({ item, resolvedClientId }) => ({
        annual_value: item.annual_value ?? null,
        cadence: item.cadence ?? null,
        client_id: resolvedClientId,
        client_source_record_id: item.client_source_record_id ?? null,
        end_date: item.end_date ?? null,
        location_id: item.location_id ?? null,
        location_source_record_id: item.location_source_record_id ?? null,
        organization_id: organizationId,
        owner_name: item.owner_name ?? null,
        payload: item.payload ?? {},
        quantity: item.quantity ?? null,
        service_area: item.service_area ?? null,
        service_code: item.service_code ?? null,
        service_name: item.service_name,
        source_record_id: item.source_record_id,
        source_system: input.source_system,
        start_date: item.start_date ?? null,
        status: item.status ?? null,
        sync_run_id: runId,
        synced_at: syncedAt,
      }))
    );

    written += await upsertRows(
      supabase,
      "management_contracts_staging",
      resolvedContracts.map(({ item, resolvedClientId }) => ({
        annual_value: item.annual_value ?? null,
        client_id: resolvedClientId,
        client_source_record_id: item.client_source_record_id ?? null,
        contract_code: item.contract_code ?? null,
        contract_type: item.contract_type ?? null,
        end_date: item.end_date ?? null,
        issue_date: item.issue_date ?? null,
        notes: item.notes ?? null,
        organization_id: organizationId,
        owner_name: item.owner_name ?? null,
        payload: item.payload ?? {},
        renewal_date: item.renewal_date ?? null,
        source_record_id: item.source_record_id,
        source_system: input.source_system,
        start_date: item.start_date ?? null,
        status: item.status ?? null,
        sync_run_id: runId,
        synced_at: syncedAt,
      }))
    );

    written += await upsertRows(
      supabase,
      "management_deadlines_staging",
      resolvedDeadlines.map(({ item, resolvedClientId }) => ({
        client_id: resolvedClientId,
        client_source_record_id: item.client_source_record_id ?? null,
        deadline_type: item.deadline_type ?? null,
        due_date: item.due_date,
        location_id: item.location_id ?? null,
        location_source_record_id: item.location_source_record_id ?? null,
        organization_id: organizationId,
        owner_name: item.owner_name ?? null,
        payload: item.payload ?? {},
        priority: item.priority ?? null,
        source_record_id: item.source_record_id,
        source_system: input.source_system,
        status: item.status ?? null,
        sync_run_id: runId,
        synced_at: syncedAt,
        title: item.title,
      }))
    );

    written += await upsertRows(
      supabase,
      "management_capacity_staging",
      resolvedCapacity.map(({ item, resolvedClientId }) => ({
        client_id: resolvedClientId,
        client_source_record_id: item.client_source_record_id ?? null,
        location_id: item.location_id ?? null,
        location_source_record_id: item.location_source_record_id ?? null,
        organization_id: organizationId,
        owner_name: item.owner_name ?? null,
        payload: item.payload ?? {},
        period_end: item.period_end ?? null,
        period_start: item.period_start ?? null,
        personnel_id: item.personnel_id ?? null,
        planned_fte: item.planned_fte ?? null,
        planned_hours: item.planned_hours ?? null,
        service_line_source_record_id: item.service_line_source_record_id ?? null,
        source_record_id: item.source_record_id,
        source_system: input.source_system,
        status: item.status ?? null,
        sync_run_id: runId,
        synced_at: syncedAt,
      }))
    );

    await finalizeSyncRun(supabase, runId, {
      recordsWritten: written,
      status: written === 0 ? "warning" : "success",
    });

    return {
      counts,
      dryRun: false,
      mode: input.sync_mode,
      organizationId,
      reconciliation,
      runId,
      scope: input.sync_scope,
      sourceSystem: input.source_system,
      written,
    };
  } catch (error) {
    await finalizeSyncRun(supabase, runId, {
      errorSummary: error instanceof Error ? error.message : "Unknown sync failure.",
      recordsWritten: 0,
      status: "failed",
    });

    throw error;
  }
}
