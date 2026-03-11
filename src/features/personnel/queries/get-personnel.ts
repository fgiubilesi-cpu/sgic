import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database.types';

type PersonnelRow = Tables<'personnel'>;

export interface PersonnelListItem extends PersonnelRow {
  client_name: string | null;
  location_name: string | null;
}

export async function getPersonnelList(
  organizationId: string,
  clientId?: string
): Promise<PersonnelListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from('personnel')
    .select('*')
    .eq('organization_id', organizationId)
    .order('last_name')
    .order('first_name');

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: personnel, error } = await query;

  if (error) {
    throw error;
  }

  const clientIds = Array.from(
    new Set((personnel ?? []).map((person) => person.client_id).filter(Boolean))
  ) as string[];
  const locationIds = Array.from(
    new Set((personnel ?? []).map((person) => person.location_id).filter(Boolean))
  ) as string[];

  const [{ data: clients, error: clientsError }, { data: locations, error: locationsError }] =
    await Promise.all([
      clientIds.length
        ? supabase.from('clients').select('id, name').in('id', clientIds)
        : Promise.resolve({ data: [], error: null }),
      locationIds.length
        ? supabase.from('locations').select('id, name').in('id', locationIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (clientsError) {
    throw clientsError;
  }

  if (locationsError) {
    throw locationsError;
  }

  const clientMap = new Map((clients ?? []).map((client) => [client.id, client.name]));
  const locationMap = new Map((locations ?? []).map((location) => [location.id, location.name]));

  return (personnel ?? []).map((person) => ({
    ...person,
    client_name: person.client_id ? clientMap.get(person.client_id) ?? null : null,
    location_name: person.location_id ? locationMap.get(person.location_id) ?? null : null,
  }));
}
