'use server';

import { revalidatePath } from 'next/cache';
import { assertInternalOperator } from '@/lib/access-control';
import { recordAppEvent } from '@/lib/app-event-log';
import { createClient as createSupabaseClient } from '@/lib/supabase/server';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import {
  buildClientDeadlineMutationPayload,
  buildClientTaskMutationPayload,
  buildClientTaskStatusPatch,
} from '@/features/clients/lib/client-workspace-action-payloads';
import {
  clientContactSchema,
  clientContractSchema,
  clientDeadlineSchema,
  clientNoteSchema,
  clientTaskSchema,
  type ClientContactInput,
  type ClientContractInput,
  type ClientDeadlineInput,
  type ClientNoteInput,
  type ClientTaskInput,
} from '@/features/clients/schemas/client-workspace-schema';
import type { ClientTaskStatus } from '@/features/clients/queries/get-client-workspace';

function normalizeOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function normalizeOptionalDate(value: string) {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

async function ensureClientAccess(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  organizationId: string,
  clientId: string
) {
  const { data: client, error } = await supabase
    .from('clients')
    .select('id')
    .eq('id', clientId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !client) {
    throw new Error('Cliente non valido');
  }
}

async function ensureLocationAccess(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  organizationId: string,
  clientId: string,
  locationId: string | null
) {
  if (!locationId) return null;

  const { data, error } = await supabase
    .from('locations')
    .select('id')
    .eq('id', locationId)
    .eq('organization_id', organizationId)
    .eq('client_id', clientId)
    .single();

  if (error || !data) {
    throw new Error('La sede selezionata non appartiene al cliente');
  }

  return data.id;
}

async function ensureAuditAccess(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  organizationId: string,
  clientId: string,
  auditId: string | null
) {
  if (!auditId) return null;

  const { data, error } = await supabase
    .from('audits')
    .select('id')
    .eq('id', auditId)
    .eq('organization_id', organizationId)
    .eq('client_id', clientId)
    .single();

  if (error || !data) {
    throw new Error("L'audit selezionato non appartiene al cliente");
  }

  return data.id;
}

async function ensureServiceLineAccess(
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  organizationId: string,
  clientId: string,
  serviceLineId: string | null,
  locationId: string | null
) {
  if (!serviceLineId) return null;

  const { data, error } = await supabase
    .from('client_service_lines')
    .select('id, location_id')
    .eq('id', serviceLineId)
    .eq('organization_id', organizationId)
    .eq('client_id', clientId)
    .single();

  if (error || !data) {
    throw new Error('La linea servizio selezionata non appartiene al cliente');
  }

  if (data.location_id && locationId && data.location_id !== locationId) {
    throw new Error('La linea servizio selezionata non e coerente con la sede indicata');
  }

  return data.id;
}

function revalidateClientWorkspace(clientId: string) {
  revalidatePath('/clients');
  revalidatePath(`/clients/${clientId}`);
}

function normalizeActionError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function upsertClientContract(clientId: string, input: ClientContractInput) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');

    const validated = clientContractSchema.parse(input);
    const supabase = await createSupabaseClient();
    await ensureClientAccess(supabase, ctx.organizationId, clientId);

    const payload = {
      organization_id: ctx.organizationId,
      client_id: clientId,
      client_references: normalizeOptionalString(validated.client_references),
      contract_type: validated.contract_type,
      duration_terms: normalizeOptionalString(validated.duration_terms),
      status: validated.status,
      start_date: normalizeOptionalDate(validated.start_date),
      issue_date: normalizeOptionalDate(validated.issue_date),
      renewal_date: normalizeOptionalDate(validated.renewal_date),
      end_date: normalizeOptionalDate(validated.end_date),
      exercised_activity: normalizeOptionalString(validated.exercised_activity),
      protocol_code: normalizeOptionalString(validated.protocol_code),
      service_scope: normalizeOptionalString(validated.service_scope),
      supervisor_name: normalizeOptionalString(validated.supervisor_name),
      activity_frequency: normalizeOptionalString(validated.activity_frequency),
      internal_owner: normalizeOptionalString(validated.internal_owner),
      validity_terms: normalizeOptionalString(validated.validity_terms),
      notes: normalizeOptionalString(validated.notes),
      attachment_url: normalizeOptionalString(validated.attachment_url),
    };

    const { data: existing } = await supabase
      .from('client_contracts')
      .select('id')
      .eq('organization_id', ctx.organizationId)
      .eq('client_id', clientId)
      .maybeSingle();

    const query = existing?.id
      ? supabase
          .from('client_contracts')
          .update(payload)
          .eq('id', existing.id)
          .eq('organization_id', ctx.organizationId)
      : supabase.from('client_contracts').insert(payload);

    const { data, error } = await query.select().single();
    if (error) throw error;

    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore salvataggio contratto'),
    };
  }
}

export async function createClientTask(clientId: string, input: ClientTaskInput) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');

    const validated = clientTaskSchema.parse(input);
    const supabase = await createSupabaseClient();
    await ensureClientAccess(supabase, ctx.organizationId, clientId);

    const locationId = await ensureLocationAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.location_id)
    );
    const auditId = await ensureAuditAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.audit_id)
    );
    const serviceLineId = await ensureServiceLineAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.service_line_id),
      locationId
    );

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('client_tasks')
      .insert(
        buildClientTaskMutationPayload({
          auditId,
          clientId,
          locationId,
          now,
          organizationId: ctx.organizationId,
          serviceLineId,
          validated,
        })
      )
      .select()
      .single();

    if (error) throw error;
    await recordAppEvent(ctx, {
      action: 'INSERT',
      details: data.title,
      payload: {
        client_id: clientId,
        entity: 'client_task',
        priority: data.priority ?? null,
        status: data.status ?? null,
      },
      recordId: data.id,
      tableName: 'client_workspace_events',
      title: 'Task cliente creata',
    });
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore creazione attività'),
    };
  }
}

export async function updateClientTask(taskId: string, clientId: string, input: ClientTaskInput) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');

    const validated = clientTaskSchema.parse(input);
    const supabase = await createSupabaseClient();
    await ensureClientAccess(supabase, ctx.organizationId, clientId);

    const locationId = await ensureLocationAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.location_id)
    );
    const auditId = await ensureAuditAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.audit_id)
    );
    const serviceLineId = await ensureServiceLineAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.service_line_id),
      locationId
    );

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('client_tasks')
      .update(
        buildClientTaskMutationPayload({
          auditId,
          clientId,
          locationId,
          now,
          organizationId: ctx.organizationId,
          serviceLineId,
          validated,
        })
      )
      .eq('id', taskId)
      .eq('organization_id', ctx.organizationId)
      .eq('client_id', clientId)
      .select()
      .single();

    if (error) throw error;
    await recordAppEvent(ctx, {
      action: 'UPDATE',
      details: data.title,
      payload: {
        client_id: clientId,
        entity: 'client_task',
        priority: data.priority ?? null,
        status: data.status ?? null,
      },
      recordId: data.id,
      tableName: 'client_workspace_events',
      title: 'Task cliente aggiornata',
    });
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore aggiornamento attività'),
    };
  }
}

export async function setClientTaskStatus(taskId: string, clientId: string, status: ClientTaskStatus) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');
    const supabase = await createSupabaseClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('client_tasks')
      .update(buildClientTaskStatusPatch(status, now))
      .eq('id', taskId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId)
      .select()
      .single();

    if (error) throw error;
    await recordAppEvent(ctx, {
      action: 'UPDATE',
      details: `${data.title ?? 'Task'} -> ${status}`,
      payload: {
        client_id: clientId,
        completed_at: data.completed_at ?? null,
        entity: 'client_task',
        status,
      },
      recordId: taskId,
      tableName: 'client_workspace_events',
      title: 'Stato task cliente aggiornato',
    });
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, "Errore aggiornamento stato attività"),
    };
  }
}

export async function setClientTaskServiceLine(
  taskId: string,
  clientId: string,
  serviceLineIdInput: string | null
) {
  try {
    const ctx = await getOrganizationContext();
    if (!ctx) throw new Error('Unauthorized');
    const supabase = await createSupabaseClient();
    await ensureClientAccess(supabase, ctx.organizationId, clientId);

    const { data: task, error: taskError } = await supabase
      .from('client_tasks')
      .select('id, location_id')
      .eq('id', taskId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (taskError || !task) throw new Error('Attività non valida');

    const serviceLineId = await ensureServiceLineAccess(
      supabase,
      ctx.organizationId,
      clientId,
      serviceLineIdInput,
      task.location_id
    );

    const { data, error } = await supabase
      .from('client_tasks')
      .update({
        service_line_id: serviceLineId,
      })
      .eq('id', taskId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId)
      .select()
      .single();

    if (error) throw error;
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore aggiornamento linea servizio attività'),
    };
  }
}

export async function createClientContact(clientId: string, input: ClientContactInput) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');

    const validated = clientContactSchema.parse(input);
    const supabase = await createSupabaseClient();
    await ensureClientAccess(supabase, ctx.organizationId, clientId);

    const locationId = await ensureLocationAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.location_id)
    );

    const { data, error } = await supabase
      .from('client_contacts')
      .insert({
        organization_id: ctx.organizationId,
        client_id: clientId,
        full_name: validated.full_name,
        role: normalizeOptionalString(validated.role),
        department: normalizeOptionalString(validated.department),
        email: normalizeOptionalString(validated.email),
        phone: normalizeOptionalString(validated.phone),
        location_id: locationId,
        is_primary: validated.is_primary,
        is_active: validated.is_active,
        notes: normalizeOptionalString(validated.notes),
      })
      .select()
      .single();

    if (error) throw error;
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore creazione contatto'),
    };
  }
}

export async function updateClientContact(
  contactId: string,
  clientId: string,
  input: ClientContactInput
) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');

    const validated = clientContactSchema.parse(input);
    const supabase = await createSupabaseClient();
    await ensureClientAccess(supabase, ctx.organizationId, clientId);

    const locationId = await ensureLocationAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.location_id)
    );

    const { data, error } = await supabase
      .from('client_contacts')
      .update({
        full_name: validated.full_name,
        role: normalizeOptionalString(validated.role),
        department: normalizeOptionalString(validated.department),
        email: normalizeOptionalString(validated.email),
        phone: normalizeOptionalString(validated.phone),
        location_id: locationId,
        is_primary: validated.is_primary,
        is_active: validated.is_active,
        notes: normalizeOptionalString(validated.notes),
      })
      .eq('id', contactId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId)
      .select()
      .single();

    if (error) throw error;
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore aggiornamento contatto'),
    };
  }
}

export async function deleteClientContact(contactId: string, clientId: string) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');
    const supabase = await createSupabaseClient();

    const { error } = await supabase
      .from('client_contacts')
      .delete()
      .eq('id', contactId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId);

    if (error) throw error;
    revalidateClientWorkspace(clientId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore eliminazione contatto'),
    };
  }
}

export async function setClientDeadlineServiceLine(
  deadlineId: string,
  clientId: string,
  serviceLineIdInput: string | null
) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');
    const supabase = await createSupabaseClient();
    await ensureClientAccess(supabase, ctx.organizationId, clientId);

    const { data: deadline, error: deadlineError } = await supabase
      .from('client_deadlines')
      .select('id, location_id')
      .eq('id', deadlineId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (deadlineError || !deadline) throw new Error('Scadenza non valida');

    const serviceLineId = await ensureServiceLineAccess(
      supabase,
      ctx.organizationId,
      clientId,
      serviceLineIdInput,
      deadline.location_id
    );

    const { data, error } = await supabase
      .from('client_deadlines')
      .update({
        service_line_id: serviceLineId,
      })
      .eq('id', deadlineId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId)
      .select()
      .single();

    if (error) throw error;
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore aggiornamento linea servizio scadenza'),
    };
  }
}

export async function createClientDeadline(clientId: string, input: ClientDeadlineInput) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');

    const validated = clientDeadlineSchema.parse(input);
    const supabase = await createSupabaseClient();
    await ensureClientAccess(supabase, ctx.organizationId, clientId);

    const locationId = await ensureLocationAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.location_id)
    );
    const serviceLineId = await ensureServiceLineAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.service_line_id),
      locationId
    );

    const { data, error } = await supabase
      .from('client_deadlines')
      .insert(
        buildClientDeadlineMutationPayload({
          clientId,
          createdBy: ctx.userId,
          locationId,
          organizationId: ctx.organizationId,
          serviceLineId,
          validated,
        })
      )
      .select()
      .single();

    if (error) throw error;
    await recordAppEvent(ctx, {
      action: 'INSERT',
      details: data.title,
      payload: {
        client_id: clientId,
        due_date: data.due_date,
        entity: 'client_deadline',
        status: data.status ?? null,
      },
      recordId: data.id,
      tableName: 'client_workspace_events',
      title: 'Scadenza cliente creata',
    });
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore creazione scadenza manuale'),
    };
  }
}

export async function updateClientDeadline(
  deadlineId: string,
  clientId: string,
  input: ClientDeadlineInput
) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');

    const validated = clientDeadlineSchema.parse(input);
    const supabase = await createSupabaseClient();
    await ensureClientAccess(supabase, ctx.organizationId, clientId);

    const locationId = await ensureLocationAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.location_id)
    );
    const serviceLineId = await ensureServiceLineAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.service_line_id),
      locationId
    );

    const { data, error } = await supabase
      .from('client_deadlines')
      .update(
        buildClientDeadlineMutationPayload({
          clientId,
          locationId,
          organizationId: ctx.organizationId,
          serviceLineId,
          validated,
        })
      )
      .eq('id', deadlineId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId)
      .eq('source_type', 'manual')
      .select()
      .single();

    if (error) throw error;
    await recordAppEvent(ctx, {
      action: 'UPDATE',
      details: data.title,
      payload: {
        client_id: clientId,
        due_date: data.due_date,
        entity: 'client_deadline',
        status: data.status ?? null,
      },
      recordId: data.id,
      tableName: 'client_workspace_events',
      title: 'Scadenza cliente aggiornata',
    });
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore aggiornamento scadenza manuale'),
    };
  }
}

export async function deleteClientDeadline(deadlineId: string, clientId: string) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');
    const supabase = await createSupabaseClient();

    const { error } = await supabase
      .from('client_deadlines')
      .delete()
      .eq('id', deadlineId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId)
      .eq('source_type', 'manual');

    if (error) throw error;
    await recordAppEvent(ctx, {
      action: 'DELETE',
      details: 'Scadenza manuale rimossa',
      payload: {
        client_id: clientId,
        entity: 'client_deadline',
      },
      recordId: deadlineId,
      tableName: 'client_workspace_events',
      title: 'Scadenza cliente eliminata',
    });
    revalidateClientWorkspace(clientId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore eliminazione scadenza manuale'),
    };
  }
}

export async function createClientNote(clientId: string, input: ClientNoteInput) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');

    const validated = clientNoteSchema.parse(input);
    const supabase = await createSupabaseClient();
    await ensureClientAccess(supabase, ctx.organizationId, clientId);

    const locationId = await ensureLocationAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.location_id)
    );

    const { data, error } = await supabase
      .from('client_notes')
      .insert({
        organization_id: ctx.organizationId,
        client_id: clientId,
        title: validated.title,
        body: validated.body,
        note_type: validated.note_type,
        pinned: validated.pinned,
        location_id: locationId,
        created_by: ctx.userId,
      })
      .select()
      .single();

    if (error) throw error;
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore creazione nota'),
    };
  }
}

export async function updateClientNote(noteId: string, clientId: string, input: ClientNoteInput) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');

    const validated = clientNoteSchema.parse(input);
    const supabase = await createSupabaseClient();
    await ensureClientAccess(supabase, ctx.organizationId, clientId);

    const locationId = await ensureLocationAccess(
      supabase,
      ctx.organizationId,
      clientId,
      normalizeOptionalString(validated.location_id)
    );

    const { data, error } = await supabase
      .from('client_notes')
      .update({
        title: validated.title,
        body: validated.body,
        note_type: validated.note_type,
        pinned: validated.pinned,
        location_id: locationId,
      })
      .eq('id', noteId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId)
      .select()
      .single();

    if (error) throw error;
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore aggiornamento nota'),
    };
  }
}

export async function setClientNotePinned(noteId: string, clientId: string, pinned: boolean) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase
      .from('client_notes')
      .update({ pinned })
      .eq('id', noteId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId)
      .select()
      .single();

    if (error) throw error;
    revalidateClientWorkspace(clientId);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore aggiornamento nota'),
    };
  }
}

export async function deleteClientNote(noteId: string, clientId: string) {
  try {
    const ctx = await getOrganizationContext();
    assertInternalOperator(ctx, 'workspace cliente');
    const supabase = await createSupabaseClient();

    const { error } = await supabase
      .from('client_notes')
      .delete()
      .eq('id', noteId)
      .eq('client_id', clientId)
      .eq('organization_id', ctx.organizationId);

    if (error) throw error;
    revalidateClientWorkspace(clientId);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: normalizeActionError(error, 'Errore eliminazione nota'),
    };
  }
}
