import { redirect } from 'next/navigation';
import { getClient } from '@/features/clients/queries/get-client';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import { getPersonnelList } from '@/features/personnel/queries/get-personnel';
import { ClientDetailWorkspace } from '@/features/clients/components/client-detail-workspace';
import { getAuditTimeline } from '@/features/audits/queries/get-audit-timeline';
import { getDocuments } from '@/features/documents/queries/get-documents';
import { getClientWorkspaceData } from '@/features/clients/queries/get-client-workspace';

export const metadata = {
  title: 'Dettaglio Cliente - SGIC',
  description: 'Dettaglio cliente e sedi',
};

interface ClientDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClientDetailPage({ params: paramsProm }: ClientDetailPageProps) {
  const params = await paramsProm;
  const orgContext = await getOrganizationContext();

  if (!orgContext) {
    redirect('/login');
  }

  const client = await getClient(params.id, orgContext.organizationId);

  if (!client) {
    redirect('/clients');
  }

  const [personnel, audits, timelineEvents, workspace] = await Promise.all([
    getPersonnelList(orgContext.organizationId, client.id),
    orgContext.supabase
      .from('audits')
      .select('id, title, status, scheduled_date, score, location_id')
      .eq('organization_id', orgContext.organizationId)
      .eq('client_id', client.id)
      .order('scheduled_date', { ascending: false }),
    getAuditTimeline(client.id),
    getClientWorkspaceData(orgContext.organizationId, client.id),
  ]);

  const documents = await getDocuments({
    clientIds: [client.id],
    locationIds: client.locations.map((location) => location.id),
    organizationId: orgContext.organizationId,
    personnelIds: personnel.map((person) => person.id),
  });

  const auditIds = (audits.data ?? []).map((audit) => audit.id);
  const { data: nonConformities } =
    auditIds.length > 0
      ? await orgContext.supabase
          .from('non_conformities')
          .select('audit_id, status')
          .eq('organization_id', orgContext.organizationId)
          .in('audit_id', auditIds)
          .neq('status', 'closed')
      : { data: [] };

  const locationMap = new Map(client.locations.map((location) => [location.id, location.name]));
  const openNcCountByAuditId = (nonConformities ?? []).reduce<Record<string, number>>((acc, nc) => {
    acc[nc.audit_id] = (acc[nc.audit_id] ?? 0) + 1;
    return acc;
  }, {});
  const openNcCount = Object.values(openNcCountByAuditId).reduce((sum, count) => sum + count, 0);
  const clientOptions = [
    {
      id: client.id,
      name: client.name,
      locations: client.locations.map((location) => ({
        id: location.id,
        name: location.name,
      })),
    },
  ];

  return (
    <ClientDetailWorkspace
      audits={(audits.data ?? []).map((audit) => ({
        id: audit.id,
        title: audit.title,
        status: audit.status,
        scheduled_date: audit.scheduled_date,
        score: audit.score,
        location_id: audit.location_id,
        location_name: audit.location_id ? locationMap.get(audit.location_id) ?? null : null,
        nc_count: openNcCountByAuditId[audit.id] ?? 0,
      }))}
      client={client}
      clientOptions={clientOptions}
      documents={documents}
      manualDeadlines={workspace.manualDeadlines}
      missingWorkspaceTables={workspace.missingTables}
      notes={workspace.notes}
      openNcCount={openNcCount}
      personnel={personnel}
      tasks={workspace.tasks}
      timelineEvents={timelineEvents}
      contacts={workspace.contacts}
      contract={workspace.contract}
    />
  );
}
