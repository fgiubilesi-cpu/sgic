import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database.types';

type DocumentRow = Tables<'documents'>;

export interface DocumentListItem extends DocumentRow {
  client_name: string | null;
  location_name: string | null;
  personnel_name: string | null;
}

interface GetDocumentsOptions {
  clientIds?: string[];
  locationIds?: string[];
  organizationId: string;
  personnelIds?: string[];
}

export async function getDocuments({
  clientIds,
  locationIds,
  organizationId,
  personnelIds,
}: GetDocumentsOptions): Promise<DocumentListItem[]> {
  const supabase = await createClient();

  const query = supabase
    .from('documents')
    .select('*')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false });

  const { data: documents, error } = await query;

  if (error) throw error;

  const filteredDocuments = (documents ?? []).filter((document) => {
    const matchesClient = !clientIds?.length || (document.client_id ? clientIds.includes(document.client_id) : false);
    const matchesLocation =
      !locationIds?.length || (document.location_id ? locationIds.includes(document.location_id) : false);
    const matchesPersonnel =
      !personnelIds?.length || (document.personnel_id ? personnelIds.includes(document.personnel_id) : false);

    if (clientIds?.length || locationIds?.length || personnelIds?.length) {
      return matchesClient || matchesLocation || matchesPersonnel;
    }

    return true;
  });

  const documentClientIds = Array.from(
    new Set(filteredDocuments.map((document) => document.client_id).filter(Boolean))
  ) as string[];
  const documentLocationIds = Array.from(
    new Set(filteredDocuments.map((document) => document.location_id).filter(Boolean))
  ) as string[];
  const documentPersonnelIds = Array.from(
    new Set(filteredDocuments.map((document) => document.personnel_id).filter(Boolean))
  ) as string[];

  const [
    { data: clients, error: clientsError },
    { data: locations, error: locationsError },
    { data: personnel, error: personnelError },
  ] = await Promise.all([
    documentClientIds.length
      ? supabase.from('clients').select('id, name').in('id', documentClientIds)
      : Promise.resolve({ data: [], error: null }),
    documentLocationIds.length
      ? supabase.from('locations').select('id, name').in('id', documentLocationIds)
      : Promise.resolve({ data: [], error: null }),
    documentPersonnelIds.length
      ? supabase
          .from('personnel')
          .select('id, first_name, last_name')
          .in('id', documentPersonnelIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (clientsError) throw clientsError;
  if (locationsError) throw locationsError;
  if (personnelError) throw personnelError;

  const clientMap = new Map((clients ?? []).map((client) => [client.id, client.name]));
  const locationMap = new Map((locations ?? []).map((location) => [location.id, location.name]));
  const personnelMap = new Map(
    (personnel ?? []).map((person) => [person.id, `${person.first_name} ${person.last_name}`.trim()])
  );

  return filteredDocuments.map((document) => ({
    ...document,
    client_name: document.client_id ? clientMap.get(document.client_id) ?? null : null,
    location_name: document.location_id ? locationMap.get(document.location_id) ?? null : null,
    personnel_name: document.personnel_id ? personnelMap.get(document.personnel_id) ?? null : null,
  }));
}
