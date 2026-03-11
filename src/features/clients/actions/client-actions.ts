'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import { clientSchema, locationSchema, type ClientFormInput, type LocationFormInput } from '../schemas/client-schema';

function normalizeOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export async function createClient(input: ClientFormInput) {
  try {
    const orgContext = await getOrganizationContext();
    if (!orgContext) throw new Error('Unauthorized');

    const supabase = await createSupabaseClient();
    const validated = clientSchema.parse(input);

    const { data, error } = await supabase
      .from('clients')
      .insert({
        organization_id: orgContext.organizationId,
        name: validated.name,
        vat_number: normalizeOptionalString(validated.vat_number),
        email: normalizeOptionalString(validated.email),
        phone: normalizeOptionalString(validated.phone),
        notes: normalizeOptionalString(validated.notes),
        is_active: validated.is_active,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/clients');
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore creazione cliente';
    return { success: false, error: message };
  }
}

export async function updateClient(
  clientId: string,
  input: ClientFormInput
) {
  try {
    const orgContext = await getOrganizationContext();
    if (!orgContext) throw new Error('Unauthorized');

    const supabase = await createSupabaseClient();
    const validated = clientSchema.parse(input);

    const { data, error } = await supabase
      .from('clients')
      .update({
        name: validated.name,
        vat_number: normalizeOptionalString(validated.vat_number),
        email: normalizeOptionalString(validated.email),
        phone: normalizeOptionalString(validated.phone),
        notes: normalizeOptionalString(validated.notes),
        is_active: validated.is_active,
      })
      .eq('id', clientId)
      .eq('organization_id', orgContext.organizationId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/clients');
    revalidatePath(`/clients/${clientId}`);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore aggiornamento cliente';
    return { success: false, error: message };
  }
}

export async function createLocation(
  clientId: string,
  input: LocationFormInput
) {
  try {
    const orgContext = await getOrganizationContext();
    if (!orgContext) throw new Error('Unauthorized');

    const supabase = await createSupabaseClient();
    const validated = locationSchema.parse(input);

    const { data, error } = await supabase
      .from('locations')
      .insert({
        organization_id: orgContext.organizationId,
        client_id: clientId,
        name: validated.name,
        address: normalizeOptionalString(validated.address),
        city: normalizeOptionalString(validated.city),
        type: normalizeOptionalString(validated.type),
        notes: normalizeOptionalString(validated.notes),
        is_active: validated.is_active,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/clients');
    revalidatePath(`/clients/${clientId}`);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore creazione sede';
    return { success: false, error: message };
  }
}

export async function updateLocation(
  locationId: string,
  input: LocationFormInput
) {
  try {
    const orgContext = await getOrganizationContext();
    if (!orgContext) throw new Error('Unauthorized');

    const supabase = await createSupabaseClient();
    const validated = locationSchema.parse(input);

    const { data, error } = await supabase
      .from('locations')
      .update({
        name: validated.name,
        address: normalizeOptionalString(validated.address),
        city: normalizeOptionalString(validated.city),
        type: normalizeOptionalString(validated.type),
        notes: normalizeOptionalString(validated.notes),
        is_active: validated.is_active,
      })
      .eq('id', locationId)
      .eq('organization_id', orgContext.organizationId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/clients');
    if (data?.client_id) {
      revalidatePath(`/clients/${data.client_id}`);
    }
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore aggiornamento sede';
    return { success: false, error: message };
  }
}

export async function setClientActiveState(clientId: string, isActive: boolean) {
  try {
    const orgContext = await getOrganizationContext();
    if (!orgContext) throw new Error('Unauthorized');

    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('clients')
      .update({ is_active: isActive })
      .eq('id', clientId)
      .eq('organization_id', orgContext.organizationId)
      .select('id')
      .single();

    if (error) throw error;

    revalidatePath('/clients');
    revalidatePath(`/clients/${clientId}`);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore aggiornamento stato cliente';
    return { success: false, error: message };
  }
}

export async function setLocationActiveState(locationId: string, isActive: boolean) {
  try {
    const orgContext = await getOrganizationContext();
    if (!orgContext) throw new Error('Unauthorized');

    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('locations')
      .update({ is_active: isActive })
      .eq('id', locationId)
      .eq('organization_id', orgContext.organizationId)
      .select('id, client_id')
      .single();

    if (error) throw error;

    revalidatePath('/clients');
    if (data?.client_id) {
      revalidatePath(`/clients/${data.client_id}`);
    }
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore aggiornamento stato sede';
    return { success: false, error: message };
  }
}
