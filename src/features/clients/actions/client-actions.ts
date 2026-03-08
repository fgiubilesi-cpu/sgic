'use server';

import { revalidatePath } from 'next/cache';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import { clientSchema, locationSchema, type ClientFormInput, type LocationFormInput } from '../schemas/client-schema';

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
        ...validated,
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
      .update(validated)
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
        ...validated,
      })
      .select()
      .single();

    if (error) throw error;

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
      .update(validated)
      .eq('id', locationId)
      .eq('organization_id', orgContext.organizationId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath(`/clients`);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore aggiornamento sede';
    return { success: false, error: message };
  }
}
