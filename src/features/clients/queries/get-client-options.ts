import { createClient } from '@/lib/supabase/server';
import { runClientsQueryWithSoftDeleteFallback } from "@/lib/supabase/clients-soft-delete";

export interface ClientLocationOption {
  id: string;
  name: string;
}

export interface ClientOption {
  id: string;
  name: string;
  locations: ClientLocationOption[];
}

export async function getClientOptions(
  organizationId: string
): Promise<ClientOption[]> {
  const supabase = await createClient();

  const { data: clients, error: clientsError } =
    await runClientsQueryWithSoftDeleteFallback((useSoftDeleteGuard) => {
      let query = supabase
        .from('clients')
        .select('id, name')
        .eq('organization_id', organizationId);

      if (useSoftDeleteGuard) {
        query = query.is('deleted_at', null);
      }

      return query.order('name');
    });

  if (clientsError) {
    throw clientsError;
  }

  const clientIds = (clients ?? []).map((client) => client.id);

  const { data: locations, error: locationsError } = clientIds.length
    ? await supabase
        .from('locations')
        .select('id, client_id, name')
        .eq('organization_id', organizationId)
        .in('client_id', clientIds)
        .order('name')
    : { data: [], error: null };

  if (locationsError) {
    throw locationsError;
  }

  const locationsByClient = new Map<string, ClientLocationOption[]>();

  for (const location of locations ?? []) {
    const current = locationsByClient.get(location.client_id) ?? [];
    current.push({ id: location.id, name: location.name });
    locationsByClient.set(location.client_id, current);
  }

  return (clients ?? []).map((client) => ({
    id: client.id,
    name: client.name,
    locations: locationsByClient.get(client.id) ?? [],
  }));
}
