import type { ServiceCoverageAuditInput, ServiceCoverageDocumentInput } from '@/features/clients/lib/client-service-coverage';
import { buildClientServiceCoverage } from '@/features/clients/lib/client-service-coverage';
import type {
  ClientDeadlineRecord,
  ClientServiceLineRecord,
  ClientTaskRecord,
} from '@/features/clients/queries/get-client-workspace';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];

type LocationListRow = {
  client_id: string;
  id: string;
  is_active: boolean | null;
  name: string;
};

export type ClientServiceOverviewStatus = 'covered' | 'critical' | 'untracked' | 'warning';

export interface ClientWithStats extends ClientRow {
  audit_count: number;
  last_audit_date: string | null;
  location_count: number;
  open_nc_count: number;
  personnel_count: number;
  service_attention_count: number;
  service_coverage_rate: number | null;
  service_guarded_count: number;
  service_link_gap_count: number;
  service_line_count: number;
  service_missing_count: number;
  service_overdue_count: number;
  service_overview_status: ClientServiceOverviewStatus;
  unlinked_open_manual_deadline_count: number;
  unlinked_open_task_count: number;
}

function isTableMissingError(error: unknown) {
  const candidate = error as { code?: string; message?: string | null };
  return (
    candidate?.code === '42P01' ||
    candidate?.code === '42703' ||
    candidate?.code === 'PGRST205' ||
    candidate?.message?.includes('Could not find the table') === true ||
    candidate?.message?.includes('Could not find the column') === true
  );
}

function groupByClientId<T extends { client_id: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    if (!acc[row.client_id]) acc[row.client_id] = [];
    acc[row.client_id].push(row);
    return acc;
  }, {});
}

export async function getClients(
  organizationId: string
): Promise<ClientWithStats[]> {
  if (!organizationId || typeof organizationId !== 'string') {
    console.error(
      '[getClients] Invalid organizationId:',
      organizationId,
      'type:',
      typeof organizationId
    );
    throw new Error(
      `Invalid organizationId: ${organizationId} (type: ${typeof organizationId})`
    );
  }

  const supabase = await createClient();

  const { data: clients, error: clientsError } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', organizationId)
    .order('name');

  if (clientsError) throw clientsError;
  if (!clients || clients.length === 0) return [];

  const clientIds = clients.map((client) => client.id);

  const [
    { data: locations, error: locationsError },
    { data: personnel, error: personnelError },
    { data: audits, error: auditsError },
    serviceLinesResult,
    tasksResult,
    deadlinesResult,
    documentsResult,
  ] = await Promise.all([
    supabase
      .from('locations')
      .select('id, client_id, name, is_active')
      .eq('organization_id', organizationId)
      .in('client_id', clientIds),
    supabase
      .from('personnel')
      .select('client_id')
      .eq('organization_id', organizationId)
      .in('client_id', clientIds),
    supabase
      .from('audits')
      .select('id, client_id, location_id, title, status, scheduled_date')
      .eq('organization_id', organizationId)
      .in('client_id', clientIds),
    supabase
      .from('client_service_lines')
      .select(
        'id, organization_id, client_id, location_id, title, code, section, notes, frequency_label, is_recurring, active, quantity, unit, unit_price, total_price, billing_phase, source_document_id, sort_order, created_at, updated_at'
      )
      .eq('organization_id', organizationId)
      .in('client_id', clientIds)
      .eq('active', true),
    supabase
      .from('client_tasks')
      .select(
        'id, organization_id, client_id, location_id, audit_id, service_line_id, title, description, status, priority, due_date, owner_name, owner_profile_id, is_recurring, recurrence_label, completed_at, created_at, updated_at'
      )
      .eq('organization_id', organizationId)
      .in('client_id', clientIds),
    supabase
      .from('client_deadlines')
      .select(
        'id, organization_id, client_id, location_id, service_line_id, title, description, due_date, priority, source_type, source_id, status, created_at, created_by, updated_at'
      )
      .eq('organization_id', organizationId)
      .in('client_id', clientIds),
    supabase
      .from('documents')
      .select('id, client_id, location_id, title, description, file_name, category, issue_date, created_at, updated_at')
      .eq('organization_id', organizationId)
      .in('client_id', clientIds),
  ]);

  if (locationsError) throw locationsError;
  if (personnelError) throw personnelError;
  if (auditsError) throw auditsError;
  if (serviceLinesResult.error && !isTableMissingError(serviceLinesResult.error)) {
    throw serviceLinesResult.error;
  }
  if (tasksResult.error && !isTableMissingError(tasksResult.error)) throw tasksResult.error;
  if (deadlinesResult.error && !isTableMissingError(deadlinesResult.error)) {
    throw deadlinesResult.error;
  }
  if (documentsResult.error && !isTableMissingError(documentsResult.error)) {
    throw documentsResult.error;
  }

  const auditIds = (audits ?? []).map((audit) => audit.id);
  const { data: nonConformities, error: nonConformitiesError } =
    auditIds.length > 0
      ? await supabase
          .from('non_conformities')
          .select('audit_id, status')
          .eq('organization_id', organizationId)
          .in('audit_id', auditIds)
          .neq('status', 'closed')
      : { data: [], error: null };

  if (nonConformitiesError) throw nonConformitiesError;

  const locationsList = (locations ?? []) as LocationListRow[];
  const locationCountByClientId = locationsList.reduce<Record<string, number>>((acc, location) => {
    acc[location.client_id] = (acc[location.client_id] ?? 0) + 1;
    return acc;
  }, {});
  const locationsByClientId = groupByClientId(locationsList);

  const personnelCountByClientId = (personnel ?? []).reduce<Record<string, number>>((acc, person) => {
    if (!person.client_id) return acc;
    acc[person.client_id] = (acc[person.client_id] ?? 0) + 1;
    return acc;
  }, {});

  const auditRows = (audits ?? []) as Array<{
    client_id: string | null;
    id: string;
    location_id: string | null;
    scheduled_date: string | null;
    status: string | null;
    title: string | null;
  }>;

  const auditsByClientId = auditRows.reduce<
    Record<string, Array<{ id: string; scheduled_date: string | null }>>
  >((acc, audit) => {
    if (!audit.client_id) return acc;
    if (!acc[audit.client_id]) acc[audit.client_id] = [];
    acc[audit.client_id].push({
      id: audit.id,
      scheduled_date: audit.scheduled_date,
    });
    return acc;
  }, {});

  const coverageAuditsByClientId = auditRows.reduce<Record<string, ServiceCoverageAuditInput[]>>(
    (acc, audit) => {
      if (!audit.client_id) return acc;
      if (!acc[audit.client_id]) acc[audit.client_id] = [];
      acc[audit.client_id].push({
        id: audit.id,
        location_id: audit.location_id,
        scheduled_date: audit.scheduled_date,
        status: audit.status ?? 'Scheduled',
        title: audit.title,
      });
      return acc;
    },
    {}
  );

  const serviceLinesByClientId = groupByClientId(
    ((serviceLinesResult.data ?? []) as ClientServiceLineRecord[]).filter((line) => line.client_id)
  );
  const tasksByClientId = groupByClientId(
    ((tasksResult.data ?? []) as ClientTaskRecord[]).filter((task) => task.client_id)
  );
  const deadlinesByClientId = groupByClientId(
    ((deadlinesResult.data ?? []) as ClientDeadlineRecord[]).filter((deadline) => deadline.client_id)
  );
  const documentsByClientId = groupByClientId(
    ((documentsResult.data ?? []) as ServiceCoverageDocumentInput[])
      .filter((document): document is ServiceCoverageDocumentInput & { client_id: string } => Boolean(document.client_id))
      .map((document) => ({
        ...document,
        client_id: document.client_id,
        last_reviewed_at: null,
      }))
  );

  const openNcCountByAuditId = (nonConformities ?? []).reduce<Record<string, number>>((acc, nc) => {
    acc[nc.audit_id] = (acc[nc.audit_id] ?? 0) + 1;
    return acc;
  }, {});

  return clients.map((client) => {
    const clientAudits = auditsByClientId[client.id] ?? [];
    const clientTasks = tasksByClientId[client.id] ?? [];
    const clientDeadlines = deadlinesByClientId[client.id] ?? [];
    const lastAudit = [...clientAudits].sort(
      (a, b) =>
        new Date(b.scheduled_date ?? 0).getTime() - new Date(a.scheduled_date ?? 0).getTime()
    )[0];
    const openNcCount = clientAudits.reduce(
      (sum, audit) => sum + (openNcCountByAuditId[audit.id] ?? 0),
      0
    );

    const coverage = buildClientServiceCoverage({
      audits: coverageAuditsByClientId[client.id] ?? [],
      deadlines: deadlinesByClientId[client.id] ?? [],
      documents: documentsByClientId[client.id] ?? [],
      locations: (locationsByClientId[client.id] ?? []).map((location) => ({
        id: location.id,
        is_active: location.is_active,
        name: location.name,
      })),
      serviceLines: serviceLinesByClientId[client.id] ?? [],
      tasks: clientTasks,
    });

    const serviceAttentionCount =
      coverage.summary.atRisk + coverage.summary.missing + coverage.summary.overdue;
    const hasTrackedServiceLines = coverage.summary.total > 0;
    const unlinkedOpenTaskCount = hasTrackedServiceLines
      ? clientTasks.filter((task) => task.status !== 'done' && !task.service_line_id).length
      : 0;
    const unlinkedOpenManualDeadlineCount = hasTrackedServiceLines
      ? clientDeadlines.filter(
          (deadline) =>
            deadline.source_type === 'manual' &&
            deadline.status === 'open' &&
            !deadline.service_line_id
        ).length
      : 0;
    const serviceLinkGapCount = unlinkedOpenTaskCount + unlinkedOpenManualDeadlineCount;
    const serviceOverviewStatus: ClientServiceOverviewStatus =
      coverage.summary.total === 0
        ? 'untracked'
        : coverage.summary.missing + coverage.summary.overdue > 0
          ? 'critical'
          : coverage.summary.atRisk > 0
            ? 'warning'
            : 'covered';

    return {
      ...client,
      audit_count: clientAudits.length,
      last_audit_date: lastAudit?.scheduled_date || null,
      location_count: locationCountByClientId[client.id] ?? 0,
      open_nc_count: openNcCount,
      personnel_count: personnelCountByClientId[client.id] ?? 0,
      service_attention_count: serviceAttentionCount,
      service_coverage_rate: coverage.summary.total > 0 ? coverage.summary.coverageRate : null,
      service_guarded_count: coverage.summary.guarded,
      service_link_gap_count: serviceLinkGapCount,
      service_line_count: coverage.summary.total,
      service_missing_count: coverage.summary.missing,
      service_overdue_count: coverage.summary.overdue,
      service_overview_status: serviceOverviewStatus,
      unlinked_open_manual_deadline_count: unlinkedOpenManualDeadlineCount,
      unlinked_open_task_count: unlinkedOpenTaskCount,
    };
  });
}
