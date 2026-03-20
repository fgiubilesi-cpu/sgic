import type { ClientServiceOverviewStatus } from '@/features/clients/queries/get-clients';
import { getClients } from '@/features/clients/queries/get-clients';

export interface ServiceCoverageOverviewClientItem {
  client_id: string;
  client_name: string;
  service_attention_count: number;
  service_coverage_rate: number | null;
  service_line_count: number;
  service_link_gap_count: number;
  service_overview_status: ClientServiceOverviewStatus;
  unlinked_open_manual_deadline_count: number;
  unlinked_open_task_count: number;
}

export interface ServiceCoverageOverviewSnapshot {
  clientsNeedingAttention: ServiceCoverageOverviewClientItem[];
  clientsWithDataGaps: ServiceCoverageOverviewClientItem[];
  summary: {
    averageCoverageRate: number | null;
    clientsTracked: number;
    clientsWithAttention: number;
    clientsWithDataGaps: number;
    criticalClients: number;
    serviceLinesTracked: number;
    totalDataGaps: number;
  };
}

function mapClientItem(client: Awaited<ReturnType<typeof getClients>>[number]): ServiceCoverageOverviewClientItem {
  return {
    client_id: client.id,
    client_name: client.name,
    service_attention_count: client.service_attention_count,
    service_coverage_rate: client.service_coverage_rate,
    service_line_count: client.service_line_count,
    service_link_gap_count: client.service_link_gap_count,
    service_overview_status: client.service_overview_status,
    unlinked_open_manual_deadline_count: client.unlinked_open_manual_deadline_count,
    unlinked_open_task_count: client.unlinked_open_task_count,
  };
}

export async function getServiceCoverageOverview(
  organizationId: string
): Promise<ServiceCoverageOverviewSnapshot> {
  const clients = await getClients(organizationId);
  const trackedClients = clients.filter((client) => client.service_line_count > 0);

  const clientsNeedingAttention = [...trackedClients]
    .filter((client) => client.service_attention_count > 0)
    .sort((left, right) => {
      const leftPriority = left.service_overview_status === 'critical' ? 0 : 1;
      const rightPriority = right.service_overview_status === 'critical' ? 0 : 1;
      if (leftPriority !== rightPriority) return leftPriority - rightPriority;

      return (
        right.service_attention_count - left.service_attention_count ||
        right.service_link_gap_count - left.service_link_gap_count ||
        (left.service_coverage_rate ?? -1) - (right.service_coverage_rate ?? -1) ||
        left.name.localeCompare(right.name, 'it')
      );
    })
    .map(mapClientItem);

  const clientsWithDataGaps = [...trackedClients]
    .filter((client) => client.service_link_gap_count > 0)
    .sort((left, right) => {
      return (
        right.service_link_gap_count - left.service_link_gap_count ||
        right.unlinked_open_task_count - left.unlinked_open_task_count ||
        right.unlinked_open_manual_deadline_count -
          left.unlinked_open_manual_deadline_count ||
        left.name.localeCompare(right.name, 'it')
      );
    })
    .map(mapClientItem);

  const coverageRates = trackedClients
    .map((client) => client.service_coverage_rate)
    .filter((value): value is number => value !== null);

  const averageCoverageRate =
    coverageRates.length > 0
      ? Math.round(
          coverageRates.reduce((sum, value) => sum + value, 0) / coverageRates.length
        )
      : null;

  return {
    clientsNeedingAttention,
    clientsWithDataGaps,
    summary: {
      averageCoverageRate,
      clientsTracked: trackedClients.length,
      clientsWithAttention: trackedClients.filter((client) => client.service_attention_count > 0)
        .length,
      clientsWithDataGaps: trackedClients.filter((client) => client.service_link_gap_count > 0)
        .length,
      criticalClients: trackedClients.filter(
        (client) => client.service_overview_status === 'critical'
      ).length,
      serviceLinesTracked: trackedClients.reduce(
        (sum, client) => sum + client.service_line_count,
        0
      ),
      totalDataGaps: trackedClients.reduce(
        (sum, client) => sum + client.service_link_gap_count,
        0
      ),
    },
  };
}
