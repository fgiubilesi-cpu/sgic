'use server'

import { getOrganizationContext } from '@/lib/supabase/get-org-context'
import { revalidatePath } from 'next/cache'

const BUCKET = 'checklist-media'
const SIGNED_URL_EXPIRY = 3600 // 1 ora

type MediaType = 'evidence' | 'audio'

function getStoragePath(
  organizationId: string,
  auditId: string,
  itemId: string,
  type: MediaType,
  ext?: string
): string {
  if (type === 'audio') {
    return `${organizationId}/${auditId}/${itemId}/audio.webm`
  }
  return `${organizationId}/${auditId}/${itemId}/evidence.${ext ?? 'jpg'}`
}

function getFileExtension(file: File): string {
  const parts = file.name.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg'
}

// --- A3: uploadChecklistMedia ---

export async function uploadChecklistMedia(formData: FormData): Promise<{
  success: boolean
  error?: string
  url?: string
}> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Non autenticato.' }

  const { supabase, organizationId } = ctx

  const file = formData.get('file') as File | null
  const itemId = formData.get('itemId') as string | null
  const auditId = formData.get('auditId') as string | null
  const type = formData.get('type') as MediaType | null
  const path = formData.get('path') as string | null

  if (!file || !itemId || !auditId || !type) {
    return { success: false, error: 'Parametri mancanti.' }
  }
  if (type !== 'evidence' && type !== 'audio') {
    return { success: false, error: 'Tipo media non valido.' }
  }

  // Verifica che l'item appartenga all'organizzazione dell'utente
  const { data: item } = await supabase
    .from('checklist_items')
    .select('id, organization_id')
    .eq('id', itemId)
    .eq('organization_id', organizationId)
    .single()

  if (!item) return { success: false, error: 'Item non trovato o non autorizzato.' }

  const ext = type === 'evidence' ? getFileExtension(file) : 'webm'
  const storagePath = getStoragePath(organizationId, auditId, itemId, type, ext)

  // Upload su Storage (upsert per sovrascrivere eventuale file precedente)
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { upsert: true, contentType: file.type })

  if (uploadError) {
    console.error('[uploadChecklistMedia] storage error:', uploadError)
    return { success: false, error: 'Errore upload file.' }
  }

  // Ottieni URL firmato (1h)
  const { data: signedData, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

  if (signedError || !signedData?.signedUrl) {
    console.error('[uploadChecklistMedia] signed url error:', signedError)
    return { success: false, error: 'Errore generazione URL firmato.' }
  }

  const signedUrl = signedData.signedUrl

  // Aggiorna checklist_items con l'URL firmato
  const column = type === 'evidence' ? 'evidence_url' : 'audio_url'
  const { error: dbError } = await supabase
    .from('checklist_items')
    .update({ [column]: signedUrl, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('organization_id', organizationId)

  if (dbError) {
    console.error('[uploadChecklistMedia] db update error:', dbError)
    return { success: false, error: 'Errore aggiornamento database.' }
  }

  if (path) revalidatePath(path)

  return { success: true, url: signedUrl }
}

// --- A4: deleteChecklistMedia ---

export async function deleteChecklistMedia(formData: FormData): Promise<{
  success: boolean
  error?: string
}> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Non autenticato.' }

  const { supabase, organizationId } = ctx

  const itemId = formData.get('itemId') as string | null
  const auditId = formData.get('auditId') as string | null
  const type = formData.get('type') as MediaType | null
  const path = formData.get('path') as string | null

  if (!itemId || !auditId || !type) {
    return { success: false, error: 'Parametri mancanti.' }
  }
  if (type !== 'evidence' && type !== 'audio') {
    return { success: false, error: 'Tipo media non valido.' }
  }

  // Verifica appartenenza all'organizzazione
  const { data: item } = await supabase
    .from('checklist_items')
    .select('id, organization_id')
    .eq('id', itemId)
    .eq('organization_id', organizationId)
    .single()

  if (!item) return { success: false, error: 'Item non trovato o non autorizzato.' }

  // Costruisci i possibili path (evidence può avere estensioni diverse)
  // Per semplicità, lista tutti i file nella cartella e rimuovi quelli del tipo corretto
  const folder = `${organizationId}/${auditId}/${itemId}`

  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET)
    .list(folder)

  if (listError) {
    console.error('[deleteChecklistMedia] list error:', listError)
    return { success: false, error: 'Errore lettura Storage.' }
  }

  const prefix = type === 'audio' ? 'audio' : 'evidence'
  const toDelete = (files ?? [])
    .filter(f => f.name.startsWith(prefix))
    .map(f => `${folder}/${f.name}`)

  if (toDelete.length > 0) {
    const { error: removeError } = await supabase.storage
      .from(BUCKET)
      .remove(toDelete)

    if (removeError) {
      console.error('[deleteChecklistMedia] remove error:', removeError)
      return { success: false, error: 'Errore eliminazione file.' }
    }
  }

  // Setta colonna a null
  const column = type === 'evidence' ? 'evidence_url' : 'audio_url'
  const { error: dbError } = await supabase
    .from('checklist_items')
    .update({ [column]: null, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('organization_id', organizationId)

  if (dbError) {
    console.error('[deleteChecklistMedia] db update error:', dbError)
    return { success: false, error: 'Errore aggiornamento database.' }
  }

  if (path) revalidatePath(path)

  return { success: true }
}
