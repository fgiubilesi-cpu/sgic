import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database.types';
import {
  getPersonnelOperationalStatus,
  getTrainingWindowSummary,
  type OperationalStatus,
} from '@/features/personnel/lib/personnel-status';

type PersonnelRow = Tables<'personnel'>;

export interface PersonnelListItem extends PersonnelRow {
  client_name: string | null;
  location_name: string | null;
  next_expiry_date: string | null;
  operational_status: OperationalStatus;
  training_expired_count: number;
  training_expiring_count: number;
  training_record_count: number;
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
  const personnelIds = (personnel ?? []).map((person) => person.id);

  const [
    { data: clients, error: clientsError },
    { data: locations, error: locationsError },
    { data: trainingRecords, error: trainingRecordsError },
  ] =
    await Promise.all([
      clientIds.length
        ? supabase.from('clients').select('id, name').in('id', clientIds)
        : Promise.resolve({ data: [], error: null }),
      locationIds.length
        ? supabase.from('locations').select('id, name').in('id', locationIds)
        : Promise.resolve({ data: [], error: null }),
      personnelIds.length
        ? supabase
            .from('training_records')
            .select('personnel_id, completion_date, expiry_date')
            .eq('organization_id', organizationId)
            .in('personnel_id', personnelIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (clientsError) {
    throw clientsError;
  }

  if (locationsError) {
    throw locationsError;
  }
  if (trainingRecordsError) {
    throw trainingRecordsError;
  }

  const clientMap = new Map((clients ?? []).map((client) => [client.id, client.name]));
  const locationMap = new Map((locations ?? []).map((location) => [location.id, location.name]));
  const trainingRecordsByPersonnelId = (trainingRecords ?? []).reduce<
    Record<string, Array<{ completion_date: string; expiry_date: string | null }>>
  >((acc, record) => {
    if (!acc[record.personnel_id]) {
      acc[record.personnel_id] = [];
    }
    acc[record.personnel_id].push({
      completion_date: record.completion_date,
      expiry_date: record.expiry_date,
    });
    return acc;
  }, {});

  return (personnel ?? []).map((person) => ({
    ...(() => {
      const personTraining = trainingRecordsByPersonnelId[person.id] ?? [];
      const trainingSummary = getTrainingWindowSummary(personTraining);
      return {
        next_expiry_date: trainingSummary.nextExpiryDate,
        operational_status: getPersonnelOperationalStatus({
          isActive: person.is_active,
          trainingSummary,
        }),
        training_expired_count: trainingSummary.expiredCount,
        training_expiring_count: trainingSummary.expiringSoonCount,
        training_record_count: trainingSummary.totalCount,
      };
    })(),
    ...person,
    client_name: person.client_id ? clientMap.get(person.client_id) ?? null : null,
    location_name: person.location_id ? locationMap.get(person.location_id) ?? null : null,
  }));
}
