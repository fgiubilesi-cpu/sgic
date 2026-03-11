import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];

export interface ClientWithStats extends ClientRow {
  audit_count: number;
  location_count: number;
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

  // Get location counts and last audit dates
  const { data: stats, error: statsError } = await supabase
    .from('locations')
    .select(`
      client_id,
      audits(created_at)
    `)
    .in('client_id', clients.map((c) => c.id));

  if (statsError) throw statsError;

  const { data: personnel, error: personnelError } = await supabase
    .from('personnel')
    .select('client_id')
    .eq('organization_id', organizationId)
    .in('client_id', clients.map((client) => client.id));

  if (personnelError) throw personnelError;

  return clients.map((client) => {
    const clientStats = stats?.filter((s) => s.client_id === client.id) || [];
    const allAudits = clientStats.flatMap((s) => s.audits || []);
    const personnelCount =
      personnel?.filter((person) => person.client_id === client.id).length ?? 0;
    const lastAudit = allAudits.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
      ...client,
      audit_count: allAudits.length,
      location_count: clientStats.length,
      personnel_count: personnelCount,
      last_audit_date: lastAudit?.created_at || null,
    };
  });
}
