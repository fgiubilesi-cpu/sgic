'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import type { PersonnelFormInput } from '../schemas/personnel-schema';
import { personnelSchema } from '../schemas/personnel-schema';
import type { Tables } from '@/types/database.types';
import type { OperationalStatus } from '@/features/personnel/lib/personnel-status';
import {
  buildPersonnelTimeline,
  getPersonnelOperationalStatus,
  getTrainingWindowSummary,
} from '@/features/personnel/lib/personnel-status';

type TrainingRecordRow = Tables<'training_records'> & {
  training_courses?: Pick<
    Tables<'training_courses'>,
    'title' | 'duration_hours' | 'category'
  > | null;
};

type SelectedTrainingRecord = {
  certificate_url: string | null;
  completion_date: string;
  course_id: string;
  expiry_date: string | null;
  id: string;
  organization_id: string;
  personnel_id: string;
  training_courses?: Pick<
    Tables<'training_courses'>,
    'title' | 'duration_hours' | 'category'
  >[] | null;
};

export interface PersonnelDetail {
  client_id: string | null;
  client_name: string | null;
  email: string | null;
  first_name: string;
  hire_date: string | null;
  id: string;
  is_active: boolean;
  last_name: string;
  location_id: string | null;
  location_name: string | null;
  next_expiry_date: string | null;
  operational_status: OperationalStatus;
  organization_id: string;
  role: string | null;
  tax_code: string | null;
  training_expired_count: number;
  training_expiring_count: number;
  training_records: TrainingRecordRow[];
  timeline: ReturnType<typeof buildPersonnelTimeline>;
}

async function ensurePersonnelRelations(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  organizationId: string,
  clientId: string,
  locationId: string | null | undefined
) {
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('organization_id', organizationId)
    .single();

  if (clientError || !client) {
    throw new Error('Cliente non valido');
  }

  if (!locationId) {
    return null;
  }

  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id')
    .eq('id', locationId)
    .eq('client_id', clientId)
    .eq('organization_id', organizationId)
    .single();

  if (locationError || !location) {
    throw new Error('La sede selezionata non appartiene al cliente');
  }

  return location.id;
}

export async function createPersonnel(input: PersonnelFormInput) {
  try {
    const orgContext = await getOrganizationContext();
    if (!orgContext) throw new Error('Unauthorized');

    const supabase = await createSupabaseClient();
    const validated = personnelSchema.parse(input);
    const locationInput = validated.location_id === 'none' ? null : validated.location_id;
    const locationId = await ensurePersonnelRelations(
      supabase,
      orgContext.organizationId,
      validated.client_id,
      locationInput
    );

    const { data, error } = await supabase
      .from('personnel')
      .insert({
        organization_id: orgContext.organizationId,
        first_name: validated.first_name,
        last_name: validated.last_name,
        role: validated.role,
        email: validated.email.trim(),
        client_id: validated.client_id,
        location_id: locationId,
        tax_code: validated.tax_code.trim() || null,
        hire_date: validated.hire_date.trim() || null,
        is_active: validated.is_active,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/personnel');
    revalidatePath(`/clients/${validated.client_id}`);
    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Errore creazione collaboratore';
    return { success: false, error: message };
  }
}

export async function updatePersonnel(personnelId: string, input: PersonnelFormInput) {
  try {
    const orgContext = await getOrganizationContext();
    if (!orgContext) throw new Error('Unauthorized');

    const supabase = await createSupabaseClient();
    const validated = personnelSchema.parse(input);
    const locationInput = validated.location_id === 'none' ? null : validated.location_id;
    const locationId = await ensurePersonnelRelations(
      supabase,
      orgContext.organizationId,
      validated.client_id,
      locationInput
    );

    const { data: existing } = await supabase
      .from('personnel')
      .select('client_id')
      .eq('id', personnelId)
      .eq('organization_id', orgContext.organizationId)
      .single();

    const { data, error } = await supabase
      .from('personnel')
      .update({
        first_name: validated.first_name,
        last_name: validated.last_name,
        role: validated.role,
        email: validated.email.trim(),
        client_id: validated.client_id,
        location_id: locationId,
        tax_code: validated.tax_code.trim() || null,
        hire_date: validated.hire_date.trim() || null,
        is_active: validated.is_active,
      })
      .eq('id', personnelId)
      .eq('organization_id', orgContext.organizationId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/personnel');
    revalidatePath(`/personnel/${personnelId}`);
    revalidatePath(`/clients/${validated.client_id}`);
    if (existing?.client_id && existing.client_id !== validated.client_id) {
      revalidatePath(`/clients/${existing.client_id}`);
    }
    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Errore aggiornamento collaboratore';
    return { success: false, error: message };
  }
}

export async function getPersonnelDetail(id: string): Promise<PersonnelDetail | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const { supabase, organizationId } = ctx;

  const { data, error } = await supabase
    .from('personnel')
    .select(
      'id, first_name, last_name, role, email, is_active, tax_code, hire_date, client_id, location_id, organization_id, training_records(id, personnel_id, course_id, completion_date, expiry_date, certificate_url, organization_id, training_courses(title, duration_hours, category))'
    )
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) return null;

  const [clientResult, locationResult] = await Promise.all([
    data.client_id
      ? supabase
          .from('clients')
          .select('name')
          .eq('id', data.client_id)
          .eq('organization_id', organizationId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    data.location_id
      ? supabase
          .from('locations')
          .select('name')
          .eq('id', data.location_id)
          .eq('organization_id', organizationId)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const normalizedTrainingRecords = ((data.training_records ?? []) as unknown as SelectedTrainingRecord[]).map(
    (record) => ({
      ...record,
      created_at: null,
      training_courses: Array.isArray(record.training_courses)
        ? record.training_courses[0] ?? null
        : (record.training_courses ?? null),
    })
  ) as TrainingRecordRow[];

  const trainingSummary = getTrainingWindowSummary(
    normalizedTrainingRecords.map((record) => ({
      completion_date: record.completion_date,
      expiry_date: record.expiry_date,
    }))
  );

  return {
    ...(data as unknown as Omit<
      PersonnelDetail,
      | 'client_name'
      | 'location_name'
      | 'next_expiry_date'
      | 'operational_status'
      | 'timeline'
      | 'training_expired_count'
      | 'training_expiring_count'
    >),
    client_name: clientResult.data?.name ?? null,
    location_name: locationResult.data?.name ?? null,
    next_expiry_date: trainingSummary.nextExpiryDate,
    operational_status: getPersonnelOperationalStatus({
      isActive: data.is_active,
      trainingSummary,
    }),
    timeline: buildPersonnelTimeline({
      firstName: data.first_name,
      hireDate: data.hire_date,
      trainingSummary,
      trainingRecords: normalizedTrainingRecords.map((record) => ({
        completion_date: record.completion_date,
        expiry_date: record.expiry_date,
      })),
    }),
    training_expired_count: trainingSummary.expiredCount,
    training_expiring_count: trainingSummary.expiringSoonCount,
    training_records: normalizedTrainingRecords,
  };
}

export async function setPersonnelActiveState(personnelId: string, isActive: boolean) {
  try {
    const orgContext = await getOrganizationContext();
    if (!orgContext) throw new Error('Unauthorized');

    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('personnel')
      .update({ is_active: isActive })
      .eq('id', personnelId)
      .eq('organization_id', orgContext.organizationId)
      .select('id, client_id')
      .single();

    if (error) throw error;

    revalidatePath('/clients');
    revalidatePath(`/personnel/${personnelId}`);
    if (data?.client_id) {
      revalidatePath(`/clients/${data.client_id}`);
    }
    return { success: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Errore aggiornamento stato collaboratore';
    return { success: false, error: message };
  }
}
