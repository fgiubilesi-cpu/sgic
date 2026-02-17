'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { auditOutcomeSchema } from '@/types/database.types'

// --- 1. UPDATE CHECKLIST ITEM (Quella che abbiamo appena fatto) ---

const UpdateItemSchema = z.object({
  itemId: z.string().uuid(),
  outcome: auditOutcomeSchema.optional(),
  notes: z.string().optional(),
  evidenceUrl: z.string().url().optional().or(z.literal('')),
  path: z.string(),
})

export async function updateChecklistItem(formData: FormData) {
  const supabase = await createClient()
  
  const rawData = {
    itemId: formData.get('itemId'),
    outcome: formData.get('outcome') || undefined,
    notes: formData.get('notes') || undefined,
    evidenceUrl: formData.get('evidenceUrl') || undefined,
    path: formData.get('path')
  }

  const result = UpdateItemSchema.safeParse(rawData)

  if (!result.success) {
    return { error: "Dati non validi." }
  }

  const { itemId, outcome, notes, evidenceUrl, path } = result.data

  const updateData: any = { 
    updated_at: new Date().toISOString() 
  }
  
  if (outcome) updateData.outcome = outcome
  if (notes !== undefined) updateData.notes = notes
  if (evidenceUrl !== undefined) updateData.evidence_url = evidenceUrl

  const { error } = await supabase
    .from('checklist_items')
    .update(updateData)
    .eq('id', itemId)

  if (error) {
    console.error("Supabase Update Error:", error)
    return { error: "Errore salvataggio." }
  }

  revalidatePath(path)
  return { success: true }
}

// --- 2. CREATE AUDIT FROM TEMPLATE (Quella che mancava!) ---

const CreateAuditSchema = z.object({
  title: z.string().min(3),
  templateId: z.string().uuid(),
  organizationId: z.string().uuid(),
})

export async function createAuditFromTemplate(prevState: any, formData: FormData) {
  const supabase = await createClient()

  // 1. Validazione Input
  const rawData = {
    title: formData.get('title'),
    templateId: formData.get('templateId'),
    organizationId: formData.get('organizationId'),
  }

  const result = CreateAuditSchema.safeParse(rawData)
  
  if (!result.success) {
    return { error: "Dati mancanti o invalidi." }
  }

  const { title, templateId, organizationId } = result.data

  // 2. Crea l'Audit Header
  const { data: audit, error: auditError } = await supabase
    .from('audits')
    .insert({
      title,
      status: 'scheduled',
      organization_id: organizationId,
      // Se hai un campo template_id nella tabella audits, scommenta sotto:
      // template_id: templateId 
    })
    .select()
    .single()

  if (auditError || !audit) {
    console.error("Error creating audit:", auditError)
    return { error: "Impossibile creare l'audit." }
  }

  // 3. Snapshotting: Copia le domande dal Template alla Checklist
  // (Questo è fondamentale per la ISO 9001)
  
  // A. Prendi le domande del template
  const { data: questions } = await supabase
    .from('template_questions')
    .select('*')
    .eq('template_id', templateId)

  if (!questions || questions.length === 0) {
    // Se il template è vuoto, creiamo l'audit ma senza domande
    redirect(`/audits/${audit.id}`)
  }

  // B. Prepara gli items per la checklist
  const checklistItems = questions.map(q => ({
    audit_id: audit.id,
    question: q.question,
    organization_id: organizationId,
    outcome: 'pending', // Default
    sort_order: q.sort_order // Se hai questa colonna, altrimenti rimuovila
  }))

  // C. Inserisci massivo
  const { error: itemsError } = await supabase
    .from('checklist_items')
    .insert(checklistItems)

  if (itemsError) {
    console.error("Error copying questions:", itemsError)
    // Non blocchiamo tutto, ma logghiamo
  }

  // 4. Redirect al nuovo audit
  revalidatePath('/audits')
  redirect(`/audits/${audit.id}`)
}