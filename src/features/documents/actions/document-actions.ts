'use server';

import { revalidatePath } from 'next/cache';
import type { Tables } from '@/types/database.types';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';
import { documentSchema, type DocumentFormInput } from '@/features/documents/schemas/document-schema';
import {
  buildIntakeProposalFromDocument,
  type DocumentIntakeProposal,
} from '@/features/documents/lib/document-intelligence';
import { extractTextFromDocumentBuffer } from '@/features/documents/lib/document-parser';
import {
  documentIntakeProposalSchema,
  documentIntakeReviewSchema,
  type DocumentIntakeReviewInput,
} from '@/features/documents/schemas/document-intake-schema';

type DocumentRow = Tables<'documents'>;

function normalizeOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed === '' || trimmed === 'none' ? null : trimmed;
}

function normalizeOptionalNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value)) return null;
  if (value < 0) return null;
  return Math.trunc(value);
}

function normalizeDateForDb(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function normalizeActionError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function revalidateDocumentScopes(document: Pick<DocumentRow, 'client_id' | 'personnel_id'>) {
  revalidatePath('/clients');
  if (document.client_id) revalidatePath(`/clients/${document.client_id}`);
  if (document.personnel_id) revalidatePath(`/personnel/${document.personnel_id}`);
}

async function createDocumentVersionSnapshot(
  ctx: NonNullable<Awaited<ReturnType<typeof getOrganizationContext>>>,
  document: DocumentRow
) {
  if (!document.storage_path) return;
  await ctx.supabase.from('document_versions').insert({
    organization_id: ctx.organizationId,
    document_id: document.id,
  });
}

async function getLatestIngestion(
  ctx: NonNullable<Awaited<ReturnType<typeof getOrganizationContext>>>,
  documentId: string
) {
  const { data, error } = await ctx.supabase
    .from('document_ingestions')
    .select('id, status, extracted_payload, created_at')
    .eq('organization_id', ctx.organizationId)
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] ?? null;
}

function parseProposalFromUnknown(input: unknown): DocumentIntakeProposal | null {
  const parsed = documentIntakeProposalSchema.safeParse(input);
  return parsed.success ? parsed.data : null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function buildFallbackProposal(document: DocumentRow) {
  return buildIntakeProposalFromDocument({
    category: document.category,
    description: document.description,
    extracted_text: null,
    expiry_date: document.expiry_date,
    file_name: document.file_name,
    issue_date: document.issue_date,
    title: document.title,
  });
}

async function buildDocumentIntakePayload(
  ctx: NonNullable<Awaited<ReturnType<typeof getOrganizationContext>>>,
  document: DocumentRow
) {
  const nowIso = new Date().toISOString();
  const fallbackProposal = buildFallbackProposal(document);

  if (!document.storage_path) {
    return {
      errorMessage: null as string | null,
      extractedText: null as string | null,
      parserType: 'manual_v1',
      payload: {
        category_suggested: document.category,
        confidence: {
          category: document.category === 'Other' ? 'low' : 'medium',
          title: document.title ? 'medium' : 'low',
        },
        extracted_at: nowIso,
        extracted_text: null,
        proposal: fallbackProposal,
        source: 'manual_v1',
      },
      status: 'manual' as const,
    };
  }

  try {
    const { data: fileBlob, error: downloadError } = await ctx.supabase.storage
      .from('documents')
      .download(document.storage_path);

    if (downloadError || !fileBlob) {
      return {
        errorMessage: downloadError?.message ?? 'Download file non riuscito',
        extractedText: null as string | null,
        parserType: 'filename_heuristics_v1',
        payload: {
          category_suggested: document.category,
          confidence: {
            category: document.category === 'Other' ? 'low' : 'medium',
            title: document.title ? 'medium' : 'low',
          },
          extracted_at: nowIso,
          extracted_text: null,
          proposal: fallbackProposal,
          source: 'filename_heuristics_v1',
        },
        status: 'review_required' as const,
      };
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const extraction = await extractTextFromDocumentBuffer({
      buffer,
      fileName: document.file_name,
      mimeType: document.mime_type,
    });
    const proposal = buildIntakeProposalFromDocument({
      category: document.category,
      description: document.description,
      extracted_text: extraction.text,
      expiry_date: document.expiry_date,
      file_name: document.file_name,
      issue_date: document.issue_date,
      title: document.title,
    });

    return {
      errorMessage: null as string | null,
      extractedText: extraction.text,
      parserType: extraction.parserType,
      payload: {
        category_suggested: document.category,
        confidence: {
          category: document.category === 'Other' ? 'low' : extraction.text ? 'high' : 'medium',
          title: document.title ? 'medium' : 'low',
        },
        extracted_at: nowIso,
        extracted_text: extraction.text,
        file: {
          mime_type: document.mime_type,
          name: document.file_name,
          size: document.file_size_bytes,
        },
        proposal,
        source: extraction.parserType,
      },
      status: 'review_required' as const,
    };
  } catch (error) {
    return {
      errorMessage: normalizeActionError(error, 'Parsing documento non riuscito'),
      extractedText: null as string | null,
      parserType: 'filename_heuristics_v1',
      payload: {
        category_suggested: document.category,
        confidence: {
          category: document.category === 'Other' ? 'low' : 'medium',
          title: document.title ? 'medium' : 'low',
        },
        extracted_at: nowIso,
        extracted_text: null,
        proposal: fallbackProposal,
        source: 'filename_heuristics_v1',
      },
      status: 'review_required' as const,
    };
  }
}

async function upsertDocumentDeadline(options: {
  clientId: string;
  document: DocumentRow;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string | null;
  userId: string;
  organizationId: string;
  supabase: NonNullable<Awaited<ReturnType<typeof getOrganizationContext>>>['supabase'];
}) {
  const {
    clientId,
    description,
    document,
    dueDate,
    organizationId,
    priority,
    supabase,
    title,
    userId,
  } = options;

  const normalizedDueDate = normalizeDateForDb(dueDate);
  if (!normalizedDueDate) return null;

  const { data: existing } = await supabase
    .from('client_deadlines')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('client_id', clientId)
    .eq('source_type', 'document')
    .eq('source_id', document.id)
    .maybeSingle();

  const payload = {
    organization_id: organizationId,
    client_id: clientId,
    location_id: document.location_id,
    source_type: 'document',
    source_id: document.id,
    title,
    description,
    due_date: normalizedDueDate,
    status: 'open',
    priority,
    created_by: userId,
  };

  const query = existing?.id
    ? supabase.from('client_deadlines').update(payload).eq('id', existing.id)
    : supabase.from('client_deadlines').insert(payload);

  const { data, error } = await query.select('id').single();
  if (error) throw error;
  return data?.id ?? null;
}

async function applyProposalToWorkspace(options: {
  ctx: NonNullable<Awaited<ReturnType<typeof getOrganizationContext>>>;
  document: DocumentRow;
  proposal: DocumentIntakeProposal;
  createFollowupTask: boolean;
  reviewId: string;
}) {
  const { ctx, createFollowupTask, document, proposal, reviewId } = options;
  const clientId = document.client_id;
  if (!clientId) {
    throw new Error('Serve un cliente collegato al documento per applicare i dati al workspace.');
  }

  const entityRows: Array<{
    confidence: string;
    entity_payload: Record<string, unknown>;
    entity_type: string;
    linked_record_id: string | null;
    linked_table: string | null;
  }> = [];

  if (document.category === 'Contract' && proposal.contract) {
    const contractPayload = proposal.contract;
    const { data: existing } = await ctx.supabase
      .from('client_contracts')
      .select('id')
      .eq('organization_id', ctx.organizationId)
      .eq('client_id', clientId)
      .maybeSingle();

    const contractData = {
      organization_id: ctx.organizationId,
      client_id: clientId,
      contract_type: contractPayload.contract_type?.trim() || 'standard',
      status: 'active',
      start_date: normalizeDateForDb(contractPayload.start_date),
      renewal_date: normalizeDateForDb(contractPayload.renewal_date),
      end_date: normalizeDateForDb(contractPayload.end_date),
      activity_frequency: normalizeOptionalString(contractPayload.activity_frequency ?? ''),
      service_scope: normalizeOptionalString(contractPayload.service_scope ?? ''),
      internal_owner: normalizeOptionalString(contractPayload.internal_owner ?? ''),
      notes: normalizeOptionalString(contractPayload.notes ?? ''),
      attachment_url: document.file_url,
    };

    const contractQuery = existing?.id
      ? ctx.supabase.from('client_contracts').update(contractData).eq('id', existing.id)
      : ctx.supabase.from('client_contracts').insert(contractData);

    const { data: contractSaved, error: contractError } = await contractQuery
      .select('id')
      .single();
    if (contractError) throw contractError;

    entityRows.push({
      confidence: proposal.confidence,
      entity_payload: contractPayload as Record<string, unknown>,
      entity_type: 'contract',
      linked_record_id: contractSaved.id,
      linked_table: 'client_contracts',
    });
  }

  if (document.category === 'OrgChart' && proposal.contacts?.length) {
    for (const contact of proposal.contacts) {
      if (!contact.full_name && !contact.email) continue;

      let existingId: string | null = null;
      if (contact.email) {
        const { data: existingByEmail } = await ctx.supabase
          .from('client_contacts')
          .select('id')
          .eq('organization_id', ctx.organizationId)
          .eq('client_id', clientId)
          .eq('email', contact.email)
          .maybeSingle();
        existingId = existingByEmail?.id ?? null;
      }

      if (!existingId && contact.full_name) {
        const { data: existingByName } = await ctx.supabase
          .from('client_contacts')
          .select('id')
          .eq('organization_id', ctx.organizationId)
          .eq('client_id', clientId)
          .eq('full_name', contact.full_name)
          .maybeSingle();
        existingId = existingByName?.id ?? null;
      }

      const contactPayload = {
        organization_id: ctx.organizationId,
        client_id: clientId,
        location_id: document.location_id,
        full_name: contact.full_name?.trim() || 'Referente da completare',
        role: normalizeOptionalString(contact.role ?? ''),
        department: normalizeOptionalString(contact.department ?? ''),
        email: normalizeOptionalString(contact.email ?? ''),
        phone: normalizeOptionalString(contact.phone ?? ''),
        is_primary: contact.is_primary ?? false,
        is_active: true,
        notes: normalizeOptionalString(`Fonte documento: ${document.title ?? 'Documento'}`),
      };

      const contactQuery = existingId
        ? ctx.supabase.from('client_contacts').update(contactPayload).eq('id', existingId)
        : ctx.supabase.from('client_contacts').insert(contactPayload);

      const { data: contactSaved, error: contactError } = await contactQuery
        .select('id')
        .single();
      if (contactError) throw contactError;

      entityRows.push({
        confidence: proposal.confidence,
        entity_payload: contact as Record<string, unknown>,
        entity_type: 'contact',
        linked_record_id: contactSaved.id,
        linked_table: 'client_contacts',
      });
    }
  }

  const deadlineCandidate =
    proposal.deadline?.due_date ??
    proposal.manual?.review_date ??
    (document.category === 'Contract' ? proposal.contract?.renewal_date : null) ??
    document.expiry_date;

  if (deadlineCandidate) {
    const deadlineId = await upsertDocumentDeadline({
      clientId,
      description:
        proposal.deadline?.description ??
        proposal.summary ??
        `Scadenza collegata a ${document.title ?? 'documento'}`,
      document,
      dueDate: deadlineCandidate,
      organizationId: ctx.organizationId,
      priority: proposal.deadline?.priority ?? 'medium',
      supabase: ctx.supabase,
      title:
        proposal.deadline?.title ??
        (document.category === 'Contract'
          ? `Rinnovo contratto ${document.title ?? ''}`.trim()
          : `Scadenza documento ${document.title ?? ''}`.trim()),
      userId: ctx.userId,
    });

    if (deadlineId) {
      entityRows.push({
        confidence: proposal.confidence,
        entity_payload: (proposal.deadline ?? {}) as Record<string, unknown>,
        entity_type: 'deadline',
        linked_record_id: deadlineId,
        linked_table: 'client_deadlines',
      });
    }
  }

  if (createFollowupTask) {
    const dueDate = normalizeDateForDb(
      proposal.deadline?.due_date ?? proposal.manual?.review_date ?? document.expiry_date
    );
    const { data: taskSaved, error: taskError } = await ctx.supabase
      .from('client_tasks')
      .insert({
        organization_id: ctx.organizationId,
        client_id: clientId,
        location_id: document.location_id,
        title: `Follow-up documento: ${document.title ?? 'Senza titolo'}`,
        description: proposal.summary || 'Task creato da intake documentale',
        status: 'open',
        priority: dueDate ? 'high' : 'medium',
        due_date: dueDate,
        owner_name: null,
        owner_profile_id: null,
        is_recurring: false,
      })
      .select('id')
      .single();

    if (taskError) throw taskError;

    entityRows.push({
      confidence: proposal.confidence,
      entity_payload: { followup: true, due_date: dueDate },
      entity_type: 'task',
      linked_record_id: taskSaved.id,
      linked_table: 'client_tasks',
    });
  }

  if (entityRows.length > 0) {
    const { error: entitiesError } = await ctx.supabase.from('document_entities').insert(
      entityRows.map((entity) => ({
        organization_id: ctx.organizationId,
        document_id: document.id,
        extraction_review_id: reviewId,
        entity_type: entity.entity_type,
        entity_payload: entity.entity_payload,
        linked_table: entity.linked_table,
        linked_record_id: entity.linked_record_id,
        confidence: entity.confidence,
        created_by: ctx.userId,
      }))
    );

    if (entitiesError) throw entitiesError;
  }
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
        storage_path: normalizeOptionalString(validated.storage_path ?? ''),
        file_name: normalizeOptionalString(validated.file_name ?? ''),
        mime_type: normalizeOptionalString(validated.mime_type ?? ''),
        file_size_bytes: normalizeOptionalNumber(validated.file_size_bytes),
        ingestion_status: validated.ingestion_status ?? 'manual',
        extracted_payload: validated.extracted_payload ?? null,
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

    let finalDocument = data;
    if (data.storage_path) {
      const intake = await buildDocumentIntakePayload(ctx, data);
      const { data: updatedDocument, error: documentUpdateError } = await ctx.supabase
        .from('documents')
        .update({
          extracted_payload: intake.payload,
          ingestion_status: intake.status,
        })
        .eq('id', data.id)
        .eq('organization_id', ctx.organizationId)
        .select()
        .single();
      if (documentUpdateError) throw documentUpdateError;
      finalDocument = updatedDocument;

      const { error: ingestionError } = await ctx.supabase.from('document_ingestions').insert({
        organization_id: ctx.organizationId,
        document_id: data.id,
        parser_type: intake.parserType,
        status: intake.status,
        extracted_text: intake.extractedText,
        extracted_payload: intake.payload,
        error_message: intake.errorMessage,
        created_by: ctx.userId,
      });
      if (ingestionError) throw ingestionError;
    }

    await createDocumentVersionSnapshot(ctx, finalDocument).catch(() => undefined);
    revalidateDocumentScopes(finalDocument);
    return { success: true, data: finalDocument };
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
    const nextStoragePath = normalizeOptionalString(validated.storage_path ?? '');
    const { data: previous } = await ctx.supabase
      .from('documents')
      .select('storage_path')
      .eq('id', documentId)
      .eq('organization_id', ctx.organizationId)
      .maybeSingle();

    const { data, error } = await ctx.supabase
      .from('documents')
      .update({
        title: validated.title,
        description: normalizeOptionalString(validated.description),
        category: validated.category,
        status: validated.status,
        version: normalizeOptionalString(validated.version),
        file_url: normalizeOptionalString(validated.file_url),
        storage_path: nextStoragePath,
        file_name: normalizeOptionalString(validated.file_name ?? ''),
        mime_type: normalizeOptionalString(validated.mime_type ?? ''),
        file_size_bytes: normalizeOptionalNumber(validated.file_size_bytes),
        ingestion_status: validated.ingestion_status ?? 'manual',
        extracted_payload: validated.extracted_payload ?? null,
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

    let finalDocument = data;
    if (data.storage_path && data.storage_path !== previous?.storage_path) {
      const intake = await buildDocumentIntakePayload(ctx, data);
      const { data: updatedDocument, error: documentUpdateError } = await ctx.supabase
        .from('documents')
        .update({
          extracted_payload: intake.payload,
          ingestion_status: intake.status,
        })
        .eq('id', data.id)
        .eq('organization_id', ctx.organizationId)
        .select()
        .single();
      if (documentUpdateError) throw documentUpdateError;
      finalDocument = updatedDocument;

      const { error: ingestionError } = await ctx.supabase.from('document_ingestions').insert({
        organization_id: ctx.organizationId,
        document_id: data.id,
        parser_type: intake.parserType,
        status: intake.status,
        extracted_text: intake.extractedText,
        extracted_payload: intake.payload,
        error_message: intake.errorMessage,
        created_by: ctx.userId,
      });
      if (ingestionError) throw ingestionError;
      await createDocumentVersionSnapshot(ctx, finalDocument).catch(() => undefined);
    }

    revalidateDocumentScopes(finalDocument);
    return { success: true, data: finalDocument };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore aggiornamento documento';
    return { success: false, error: message };
  }
}

export async function getDocumentIntakeData(documentId: string) {
  try {
    const ctx = await getOrganizationContext();
    if (!ctx) throw new Error('Unauthorized');

    const { data: document, error } = await ctx.supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (error || !document) throw error ?? new Error('Documento non trovato');

    const latestIngestion = await getLatestIngestion(ctx, document.id);
    const { data: latestReview } = await ctx.supabase
      .from('document_extraction_reviews')
      .select('id, reviewed_payload, reviewer_notes, status, review_action, created_at')
      .eq('organization_id', ctx.organizationId)
      .eq('document_id', document.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const reviewPayloadObj = asObject(latestReview?.reviewed_payload);
    const reviewProposal = parseProposalFromUnknown(reviewPayloadObj?.proposal);
    const reviewNotesFromPayload = typeof reviewPayloadObj?.reviewer_notes === 'string'
      ? reviewPayloadObj.reviewer_notes
      : null;

    const documentPayloadObj = asObject(document.extracted_payload);
    const documentProposal = parseProposalFromUnknown(documentPayloadObj?.proposal ?? document.extracted_payload);
    const fallbackProposal = buildFallbackProposal(document);

    const proposal = reviewProposal ?? documentProposal ?? fallbackProposal;
    const reviewerNotes =
      latestReview?.reviewer_notes ?? reviewNotesFromPayload ?? (typeof documentPayloadObj?.review_notes === 'string'
        ? documentPayloadObj.review_notes
        : '');

    return {
      success: true as const,
      data: {
        action: latestReview?.review_action ?? 'save_review',
        latestIngestionId: latestIngestion?.id ?? null,
        latestIngestionStatus: latestIngestion?.status ?? null,
        proposal,
        reviewerNotes,
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: normalizeActionError(error, 'Errore caricamento intake documento'),
    };
  }
}

export async function getDocumentGovernanceData(documentId: string) {
  try {
    const ctx = await getOrganizationContext();
    if (!ctx) throw new Error('Unauthorized');

    const [{ data: document, error: documentError }, { data: versions, error: versionsError }, { data: reviews, error: reviewsError }, { data: entities, error: entitiesError }] =
      await Promise.all([
        ctx.supabase
          .from('documents')
          .select('id, title, category, status, version, created_at, updated_at, ingestion_status')
          .eq('id', documentId)
          .eq('organization_id', ctx.organizationId)
          .single(),
        ctx.supabase
          .from('document_versions')
          .select('id, created_at')
          .eq('organization_id', ctx.organizationId)
          .eq('document_id', documentId)
          .order('created_at', { ascending: false }),
        ctx.supabase
          .from('document_extraction_reviews')
          .select('id, status, review_action, reviewer_notes, reviewed_at, created_at')
          .eq('organization_id', ctx.organizationId)
          .eq('document_id', documentId)
          .order('created_at', { ascending: false }),
        ctx.supabase
          .from('document_entities')
          .select('id, entity_type, linked_table, linked_record_id, confidence, created_at')
          .eq('organization_id', ctx.organizationId)
          .eq('document_id', documentId)
          .order('created_at', { ascending: false }),
      ]);

    if (documentError || !document) throw documentError ?? new Error('Documento non trovato');
    if (versionsError) throw versionsError;
    if (reviewsError) throw reviewsError;
    if (entitiesError) throw entitiesError;

    return {
      success: true as const,
      data: {
        document,
        entities: entities ?? [],
        reviews: reviews ?? [],
        versions: versions ?? [],
      },
    };
  } catch (error) {
    return {
      success: false as const,
      error: normalizeActionError(error, 'Errore caricamento governance documento'),
    };
  }
}

export async function reprocessDocumentIntake(documentId: string) {
  try {
    const ctx = await getOrganizationContext();
    if (!ctx) throw new Error('Unauthorized');

    const { data: document, error: documentError } = await ctx.supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (documentError || !document) throw documentError ?? new Error('Documento non trovato');

    const intake = await buildDocumentIntakePayload(ctx, document);

    const { error: documentUpdateError } = await ctx.supabase
      .from('documents')
      .update({
        extracted_payload: intake.payload,
        ingestion_status: intake.status,
      })
      .eq('id', document.id)
      .eq('organization_id', ctx.organizationId);
    if (documentUpdateError) throw documentUpdateError;

    const { error: ingestionError } = await ctx.supabase.from('document_ingestions').insert({
      organization_id: ctx.organizationId,
      document_id: document.id,
      parser_type: intake.parserType,
      status: intake.status,
      extracted_text: intake.extractedText,
      extracted_payload: intake.payload,
      error_message: intake.errorMessage,
      created_by: ctx.userId,
    });
    if (ingestionError) throw ingestionError;

    revalidateDocumentScopes(document);
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: normalizeActionError(error, 'Errore rilettura documento'),
    };
  }
}

export async function submitDocumentIntakeReview(documentId: string, input: DocumentIntakeReviewInput) {
  try {
    const ctx = await getOrganizationContext();
    if (!ctx) throw new Error('Unauthorized');

    const validated = documentIntakeReviewSchema.parse(input);

    const { data: document, error: documentError } = await ctx.supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', ctx.organizationId)
      .single();

    if (documentError || !document) throw documentError ?? new Error('Documento non trovato');

    const latestIngestion = await getLatestIngestion(ctx, document.id);
    const reviewStatus = validated.action === 'apply_to_workspace' ? 'applied' : 'reviewed';
    const nextDocumentStatus = validated.action === 'apply_to_workspace' ? 'linked' : 'reviewed';
    const reviewedPayload = {
      category: validated.category,
      proposal: validated.proposal,
      reviewer_notes: validated.reviewer_notes,
      reviewed_at: new Date().toISOString(),
    };

    const { data: reviewRecord, error: reviewError } = await ctx.supabase
      .from('document_extraction_reviews')
      .insert({
        organization_id: ctx.organizationId,
        document_id: document.id,
        ingestion_id: latestIngestion?.id ?? null,
        status: reviewStatus,
        review_action: validated.action,
        reviewed_payload: reviewedPayload,
        reviewer_notes: normalizeOptionalString(validated.reviewer_notes),
        created_by: ctx.userId,
        reviewed_by: ctx.userId,
        reviewed_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (reviewError) throw reviewError;

    if (validated.action === 'apply_to_workspace') {
      await applyProposalToWorkspace({
        createFollowupTask: validated.create_followup_task ?? false,
        ctx,
        document,
        proposal: validated.proposal,
        reviewId: reviewRecord.id,
      });
    }

    const documentPayloadObj = asObject(document.extracted_payload) ?? {};
    const mergedPayload = {
      ...documentPayloadObj,
      ...reviewedPayload,
    };

    const { error: updateDocumentError } = await ctx.supabase
      .from('documents')
      .update({
        extracted_payload: mergedPayload,
        ingestion_status: nextDocumentStatus,
      })
      .eq('id', document.id)
      .eq('organization_id', ctx.organizationId);
    if (updateDocumentError) throw updateDocumentError;

    if (latestIngestion?.id) {
      const { error: ingestionUpdateError } = await ctx.supabase
        .from('document_ingestions')
        .update({
          status: nextDocumentStatus,
          extracted_payload: validated.proposal,
          review_notes: normalizeOptionalString(validated.reviewer_notes),
          reviewed_at: new Date().toISOString(),
          reviewed_by: ctx.userId,
          error_message: null,
        })
        .eq('id', latestIngestion.id)
        .eq('organization_id', ctx.organizationId);
      if (ingestionUpdateError) throw ingestionUpdateError;
    } else {
      const { error: ingestionInsertError } = await ctx.supabase.from('document_ingestions').insert({
        organization_id: ctx.organizationId,
        document_id: document.id,
        parser_type: validated.proposal.parser || 'manual_review',
        status: nextDocumentStatus,
        extracted_payload: validated.proposal,
        review_notes: normalizeOptionalString(validated.reviewer_notes),
        created_by: ctx.userId,
        reviewed_by: ctx.userId,
        reviewed_at: new Date().toISOString(),
      });
      if (ingestionInsertError) throw ingestionInsertError;
    }

    revalidateDocumentScopes(document);
    return { success: true as const };
  } catch (error) {
    return {
      success: false as const,
      error: normalizeActionError(error, 'Errore salvataggio review documento'),
    };
  }
}
