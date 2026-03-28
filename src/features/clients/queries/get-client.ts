import { createClient } from '@/lib/supabase/server';
import { runClientsQueryWithSoftDeleteFallback } from "@/lib/supabase/clients-soft-delete";
import { Database } from '@/types/database.types';

type ClientRow = Database['public']['Tables']['clients']['Row'];
type LocationRow = Database['public']['Tables']['locations']['Row'];

export interface ClientDetail extends ClientRow {
  locations: LocationRow[];
}

export async function getClient(
  clientId: string,
  organizationId: string
): Promise<ClientDetail | null> {
  if (!clientId || typeof clientId !== 'string') {
    console.error('[getClient] Invalid clientId:', clientId, 'type:', typeof clientId);
    throw new Error(`Invalid clientId: ${clientId} (type: ${typeof clientId})`);
  }

  if (!organizationId || typeof organizationId !== 'string') {
    console.error(
      '[getClient] Invalid organizationId:',
      organizationId,
      'type:',
      typeof organizationId
    );
    throw new Error(
      `Invalid organizationId: ${organizationId} (type: ${typeof organizationId})`
    );
  }

  const supabase = await createClient();

  const { data: client, error: clientError } =
    await runClientsQueryWithSoftDeleteFallback((useSoftDeleteGuard) => {
      let query = supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .eq('organization_id', organizationId);

      if (useSoftDeleteGuard) {
        query = query.is('deleted_at', null);
      }

      return query.single();
    });

  if (clientError || !client) {
    if (clientError?.code === 'PGRST116') return null; // not found
    throw clientError;
  }

  const { data: locations, error: locError } = await supabase
    .from('locations')
    .select('*')
    .eq('client_id', clientId)
    .eq('organization_id', organizationId)
    .order('name');

  if (locError) throw locError;

  return {
    ...client,
    locations: locations || [],
  };
}
