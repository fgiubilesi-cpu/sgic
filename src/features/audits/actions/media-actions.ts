'use server'

import { revalidatePath } from 'next/cache'
import { getOrganizationContext } from '@/lib/supabase/get-org-context'
import {
  buildChecklistMediaStoragePath,
  CHECKLIST_MEDIA_BUCKET,
  CHECKLIST_MEDIA_SIGNED_URL_EXPIRY,
  getMediaKindFromMimeType,
  parseStorageObjectFromUrl,
  type ChecklistItemMedia,
} from '@/features/audits/lib/checklist-media'

type UploadChecklistMediaResult =
  | {
      success: true
      media: ChecklistItemMedia
    }
  | {
      success: false
      error: string
    }

type DeleteChecklistMediaResult =
  | {
      success: true
      deletedId: string
    }
  | {
      success: false
      error: string
    }

function normalizeMediaRecord(input: {
  id: string
  checklistItemId: string
  auditId: string
  organizationId: string
  storagePath: string | null
  mimeType: string | null
  mediaKind: 'image' | 'video'
  createdAt: string | null
  accessUrl: string | null
  originalName?: string | null
  source?: ChecklistItemMedia['source']
}): ChecklistItemMedia {
  return {
    id: input.id,
    checklist_item_id: input.checklistItemId,
    audit_id: input.auditId,
    organization_id: input.organizationId,
    storage_path: input.storagePath,
    mime_type: input.mimeType,
    media_kind: input.mediaKind,
    created_at: input.createdAt,
    access_url: input.accessUrl,
    original_name: input.originalName ?? null,
    source: input.source ?? 'current',
  }
}

export async function uploadChecklistMedia(formData: FormData): Promise<UploadChecklistMediaResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Non autenticato.' }

  const { supabase, organizationId } = ctx

  const file = formData.get('file') as File | null
  const itemId = formData.get('itemId') as string | null
  const auditId = formData.get('auditId') as string | null
  const path = formData.get('path') as string | null

  if (!file || !itemId || !auditId) {
    return { success: false, error: 'Parametri mancanti.' }
  }

  const mediaKind = getMediaKindFromMimeType(file.type)
  if (!['image', 'video'].includes(mediaKind)) {
    return { success: false, error: 'Tipo media non valido.' }
  }

  const { data: item } = await supabase
    .from('checklist_items')
    .select('id, audit_id, organization_id')
    .eq('id', itemId)
    .eq('organization_id', organizationId)
    .single()

  if (!item) {
    return { success: false, error: 'Item non trovato o non autorizzato.' }
  }

  const storagePath = buildChecklistMediaStoragePath({
    organizationId,
    auditId,
    itemId,
    file,
  })

  const { error: uploadError } = await supabase.storage
    .from(CHECKLIST_MEDIA_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('[uploadChecklistMedia] storage error:', uploadError)
    return { success: false, error: 'Errore upload file.' }
  }

  const insertedAt = new Date().toISOString()
  const { data: insertedMedia, error: insertError } = await supabase
    .from('checklist_item_media')
    .insert({
      audit_id: item.audit_id ?? auditId,
      checklist_item_id: itemId,
      organization_id: organizationId,
      storage_path: storagePath,
      mime_type: file.type || null,
      media_kind: mediaKind,
      original_name: file.name,
      created_at: insertedAt,
    })
    .select('id, checklist_item_id, audit_id, organization_id, storage_path, mime_type, media_kind, original_name, created_at')
    .single()

  if (insertError || !insertedMedia) {
    console.error('[uploadChecklistMedia] db insert error:', insertError)
    await supabase.storage.from(CHECKLIST_MEDIA_BUCKET).remove([storagePath]).catch(() => undefined)
    return { success: false, error: 'Errore aggiornamento database.' }
  }

  const { data: signedData, error: signedError } = await supabase.storage
    .from(CHECKLIST_MEDIA_BUCKET)
    .createSignedUrl(storagePath, CHECKLIST_MEDIA_SIGNED_URL_EXPIRY)

  if (signedError || !signedData?.signedUrl) {
    console.error('[uploadChecklistMedia] signed url error:', signedError)
    await supabase.from('checklist_item_media').delete().eq('id', insertedMedia.id)
    await supabase.storage.from(CHECKLIST_MEDIA_BUCKET).remove([storagePath]).catch(() => undefined)
    return { success: false, error: 'Errore generazione URL firmato.' }
  }

  if (path) revalidatePath(path)

  return {
    success: true,
    media: normalizeMediaRecord({
      id: insertedMedia.id,
      checklistItemId: insertedMedia.checklist_item_id,
      auditId: insertedMedia.audit_id,
      organizationId: insertedMedia.organization_id,
      storagePath: insertedMedia.storage_path,
      mimeType: insertedMedia.mime_type,
      mediaKind: insertedMedia.media_kind === 'video' ? 'video' : 'image',
      createdAt: insertedMedia.created_at,
      accessUrl: signedData.signedUrl,
      originalName: insertedMedia.original_name,
    }),
  }
}

export async function deleteChecklistMedia(formData: FormData): Promise<DeleteChecklistMediaResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Non autenticato.' }

  const { supabase, organizationId } = ctx

  const mediaId = formData.get('mediaId') as string | null
  const itemId = formData.get('itemId') as string | null
  const path = formData.get('path') as string | null

  if (!mediaId || !itemId) {
    return { success: false, error: 'Parametri mancanti.' }
  }

  const { data: item } = await supabase
    .from('checklist_items')
    .select('id, organization_id, evidence_url')
    .eq('id', itemId)
    .eq('organization_id', organizationId)
    .single()

  if (!item) {
    return { success: false, error: 'Item non trovato o non autorizzato.' }
  }

  if (mediaId.startsWith('legacy-')) {
    const legacyRef = parseStorageObjectFromUrl(item.evidence_url)
    if (legacyRef) {
      const { error: removeError } = await supabase.storage.from(legacyRef.bucket).remove([legacyRef.path])
      if (removeError) {
        console.error('[deleteChecklistMedia] legacy remove error:', removeError)
      }
    }

    const { error: updateError } = await supabase
      .from('checklist_items')
      .update({ evidence_url: null, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .eq('organization_id', organizationId)

    if (updateError) {
      console.error('[deleteChecklistMedia] legacy db update error:', updateError)
      return { success: false, error: 'Errore aggiornamento database.' }
    }

    if (path) revalidatePath(path)
    return { success: true, deletedId: mediaId }
  }

  const { data: mediaRow, error: mediaError } = await supabase
    .from('checklist_item_media')
    .select('id, storage_path, organization_id')
    .eq('id', mediaId)
    .eq('checklist_item_id', itemId)
    .eq('organization_id', organizationId)
    .single()

  if (mediaError || !mediaRow) {
    console.error('[deleteChecklistMedia] media lookup error:', mediaError)
    return { success: false, error: 'Media non trovato o non autorizzato.' }
  }

  const { error: removeError } = await supabase.storage
    .from(CHECKLIST_MEDIA_BUCKET)
    .remove([mediaRow.storage_path])

  if (removeError) {
    console.error('[deleteChecklistMedia] storage remove error:', removeError)
    return { success: false, error: 'Errore eliminazione file.' }
  }

  const { error: deleteError } = await supabase
    .from('checklist_item_media')
    .delete()
    .eq('id', mediaRow.id)
    .eq('organization_id', organizationId)

  if (deleteError) {
    console.error('[deleteChecklistMedia] db delete error:', deleteError)
    return { success: false, error: 'Errore eliminazione media.' }
  }

  if (path) revalidatePath(path)

  return { success: true, deletedId: mediaRow.id }
}
