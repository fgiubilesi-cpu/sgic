'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auditOutcomeSchema } from '@/types/database.types'

// --- 1. UPDATE CHECKLIST ITEM ---

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
    return { error: "Invalid data." }
  }

  const { itemId, outcome, notes, evidenceUrl, path } = result.data

  const updateData: Record<string, string> = {
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
    return { error: "Failed to save." }
  }

  revalidatePath(path)
  return { success: true }
}

// --- 2. UPDATE AUDIT STATUS ---

const UpdateAuditStatusSchema = z.object({
  auditId: z.string().uuid(),
  status: z.enum(['planned', 'in_progress', 'completed', 'archived']),
})

export async function updateAuditStatus(auditId: string, status: string) {
  const supabase = await createClient()

  const result = UpdateAuditStatusSchema.safeParse({ auditId, status })

  if (!result.success) {
    return { error: "Invalid data." }
  }

  const { error } = await supabase
    .from('audits')
    .update({ status: result.data.status, updated_at: new Date().toISOString() })
    .eq('id', result.data.auditId)

  if (error) {
    console.error("Supabase Update Audit Status Error:", error)
    return { error: "Failed to update audit status." }
  }

  revalidatePath(`/audits/${auditId}`)
  revalidatePath('/audits')
  return { success: true }
}

// --- 3. CREATE AUDIT FROM TEMPLATE ---

const CreateAuditFromTemplateSchema = z.object({
  title: z.string().min(3),
  scheduled_date: z.string().optional(),
  templateId: z.string().uuid(),
})

export async function createAuditFromTemplate(input: {
  title: string
  scheduled_date?: string
  templateId: string
}): Promise<{ success: true; auditId: string } | { success: false; error: string }> {
  const supabase = await createClient()

  // 1. Get the user's organization
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: "Not authenticated." }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return { success: false, error: "No organization found for your profile." }
  }

  // 2. Validate input
  const result = CreateAuditFromTemplateSchema.safeParse(input)
  if (!result.success) {
    return { success: false, error: "Missing or invalid data." }
  }

  const { title, scheduled_date, templateId } = result.data

  // 3. Create the audit
  const { data: audit, error: auditError } = await supabase
    .from('audits')
    .insert({
      title,
      status: 'planned',
      scheduled_date: scheduled_date || null,
      organization_id: profile.organization_id,
    })
    .select()
    .single()

  if (auditError || !audit) {
    console.error("Error creating audit:", auditError)
    return { success: false, error: "Unable to create audit." }
  }

  // 4. Snapshot: Copy template questions to checklist items (critical for ISO 9001)
  // Only copy active (non-soft-deleted) questions
  const { data: questions } = await supabase
    .from('template_questions')
    .select('*')
    .eq('template_id', templateId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (questions && questions.length > 0) {
    const checklistItems = questions.map(q => ({
      audit_id: audit.id,
      question: q.question,
      organization_id: profile.organization_id,
      outcome: 'pending',
      sort_order: q.sort_order,
    }))

    const { error: itemsError } = await supabase
      .from('checklist_items')
      .insert(checklistItems)

    if (itemsError) {
      console.error("Error copying questions:", itemsError)
    }
  }

  revalidatePath('/audits')
  return { success: true, auditId: audit.id }
}