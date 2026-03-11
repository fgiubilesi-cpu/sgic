import { redirect } from 'next/navigation';
import { getClient } from '@/features/clients/queries/get-client';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import { getPersonnelList } from '@/features/personnel/queries/get-personnel';
import { ClientDetailWorkspace } from '@/features/clients/components/client-detail-workspace';

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

  const [personnel, audits] = await Promise.all([
    getPersonnelList(orgContext.organizationId, client.id),
    orgContext.supabase
      .from('audits')
      .select('id, title, status, scheduled_date, score, location_id')
      .eq('organization_id', orgContext.organizationId)
      .eq('client_id', client.id)
      .order('scheduled_date', { ascending: false }),
  ]);

  const locationMap = new Map(client.locations.map((location) => [location.id, location.name]));
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
        location_name: audit.location_id ? locationMap.get(audit.location_id) ?? null : null,
      }))}
      client={client}
      clientOptions={clientOptions}
      personnel={personnel}
    />
  );
}
