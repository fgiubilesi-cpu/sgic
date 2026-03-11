import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];

export interface ClientWithStats extends ClientRow {
  audit_count: number;
  location_count: number;
  open_nc_count: number;
  personnel_count: number;
  last_audit_date: string | null;
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

  const [{ data: locations, error: locationsError }, { data: personnel, error: personnelError }, { data: audits, error: auditsError }] =
    await Promise.all([
      supabase
        .from('locations')
        .select('id, client_id')
        .eq('organization_id', organizationId)
        .in('client_id', clientIds),
      supabase
        .from('personnel')
        .select('client_id')
        .eq('organization_id', organizationId)
        .in('client_id', clientIds),
      supabase
        .from('audits')
        .select('id, client_id, scheduled_date')
        .eq('organization_id', organizationId)
        .in('client_id', clientIds),
    ]);

  if (locationsError) throw locationsError;
  if (personnelError) throw personnelError;
  if (auditsError) throw auditsError;

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

  const locationCountByClientId = (locations ?? []).reduce<Record<string, number>>((acc, location) => {
    acc[location.client_id] = (acc[location.client_id] ?? 0) + 1;
    return acc;
  }, {});

  const personnelCountByClientId = (personnel ?? []).reduce<Record<string, number>>((acc, person) => {
    if (!person.client_id) return acc;
    acc[person.client_id] = (acc[person.client_id] ?? 0) + 1;
    return acc;
  }, {});

  const auditsByClientId = (audits ?? []).reduce<Record<string, Array<{ id: string; scheduled_date: string | null }>>>(
    (acc, audit) => {
      if (!audit.client_id) return acc;
      if (!acc[audit.client_id]) acc[audit.client_id] = [];
      acc[audit.client_id].push({
        id: audit.id,
        scheduled_date: audit.scheduled_date,
      });
      return acc;
    },
    {}
  );

  const openNcCountByAuditId = (nonConformities ?? []).reduce<Record<string, number>>((acc, nc) => {
    acc[nc.audit_id] = (acc[nc.audit_id] ?? 0) + 1;
    return acc;
  }, {});

  return clients.map((client) => {
    const clientAudits = auditsByClientId[client.id] ?? [];
    const lastAudit = [...clientAudits].sort(
      (a, b) =>
        new Date(b.scheduled_date ?? 0).getTime() - new Date(a.scheduled_date ?? 0).getTime()
    )[0];
    const openNcCount = clientAudits.reduce(
      (sum, audit) => sum + (openNcCountByAuditId[audit.id] ?? 0),
      0
    );

    return {
      ...client,
      audit_count: clientAudits.length,
      location_count: locationCountByClientId[client.id] ?? 0,
      open_nc_count: openNcCount,
      personnel_count: personnelCountByClientId[client.id] ?? 0,
      last_audit_date: lastAudit?.scheduled_date || null,
    };
  });
}
