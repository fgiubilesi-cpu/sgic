import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type LocationRow = Database['public']['Tables']['locations']['Row'];

interface ClientWithStats extends ClientRow {
  location_count: number;
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
    .eq('is_active', true)
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

  return clients.map((client) => {
    const clientStats = stats?.filter((s) => s.client_id === client.id) || [];
    const allAudits = clientStats.flatMap((s) => s.audits || []);
    const lastAudit = allAudits.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
      ...client,
      location_count: clientStats.length,
      last_audit_date: lastAudit?.created_at || null,
    };
  });
}
