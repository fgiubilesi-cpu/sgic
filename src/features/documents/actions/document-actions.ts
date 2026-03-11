'use server';

import { revalidatePath } from 'next/cache';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import { documentSchema, type DocumentFormInput } from '@/features/documents/schemas/document-schema';

function normalizeOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === 'none' ? null : trimmed;
}

export async function createDocument(input: DocumentFormInput) {
  try {
    const ctx = await getOrganizationContext();
    if (!ctx) throw new Error('Unauthorized');

    const validated = documentSchema.parse(input);

    const { data, error } = await ctx.supabase
      .from('documents')
      .insert({
        organization_id: ctx.organizationId,
        title: validated.title,
        description: normalizeOptionalString(validated.description),
        category: validated.category,
        status: validated.status,
        version: normalizeOptionalString(validated.version),
        file_url: normalizeOptionalString(validated.file_url),
        issue_date: normalizeOptionalString(validated.issue_date),
        expiry_date: normalizeOptionalString(validated.expiry_date),
        client_id: normalizeOptionalString(validated.client_id),
        location_id: normalizeOptionalString(validated.location_id),
        personnel_id: normalizeOptionalString(validated.personnel_id),
        created_by: ctx.userId,
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/clients');
    if (data?.client_id) revalidatePath(`/clients/${data.client_id}`);
    if (data?.personnel_id) revalidatePath(`/personnel/${data.personnel_id}`);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore creazione documento';
    return { success: false, error: message };
  }
}

export async function updateDocument(documentId: string, input: DocumentFormInput) {
  try {
    const ctx = await getOrganizationContext();
    if (!ctx) throw new Error('Unauthorized');

    const validated = documentSchema.parse(input);

    const { data, error } = await ctx.supabase
      .from('documents')
      .update({
        title: validated.title,
        description: normalizeOptionalString(validated.description),
        category: validated.category,
        status: validated.status,
        version: normalizeOptionalString(validated.version),
        file_url: normalizeOptionalString(validated.file_url),
        issue_date: normalizeOptionalString(validated.issue_date),
        expiry_date: normalizeOptionalString(validated.expiry_date),
        client_id: normalizeOptionalString(validated.client_id),
        location_id: normalizeOptionalString(validated.location_id),
        personnel_id: normalizeOptionalString(validated.personnel_id),
      })
      .eq('id', documentId)
      .eq('organization_id', ctx.organizationId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/clients');
    if (data?.client_id) revalidatePath(`/clients/${data.client_id}`);
    if (data?.personnel_id) revalidatePath(`/personnel/${data.personnel_id}`);
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore aggiornamento documento';
    return { success: false, error: message };
  }
}
