'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrganizationContext } from '@/lib/supabase/get-org-context'
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
  const ctx = await getOrganizationContext()
  if (!ctx) return { error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

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

  // Verify checklist item belongs to user's organization
  const { data: item } = await supabase
    .from('checklist_items')
    .select('organization_id')
    .eq('id', itemId)
    .single()

  if (!item || item.organization_id !== organizationId) {
    return { error: "Unauthorized." }
  }

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
  status: z.enum(['Scheduled', 'In Progress', 'Review', 'Closed']),
})

export async function updateAuditStatus(auditId: string, status: string) {
  const ctx = await getOrganizationContext()
  if (!ctx) return { error: 'Not authenticated.' }

  const { supabase, userId, organizationId } = ctx

  const result = UpdateAuditStatusSchema.safeParse({ auditId, status })
  if (!result.success) {
    return { error: "Invalid data." }
  }

  // Verify audit belongs to user's organization
  const { data: audit } = await supabase
    .from('audits')
    .select('organization_id, status')
    .eq('id', result.data.auditId)
    .single()

  if (!audit || audit.organization_id !== organizationId) {
    return { error: "Unauthorized." }
  }

  const updatedAt = new Date().toISOString()
  const { error } = await supabase
    .from('audits')
    .update({ status: result.data.status, updated_at: updatedAt })
    .eq('id', result.data.auditId)

  if (error) {
    console.error("Supabase Update Audit Status Error:", error)
    return { error: "Failed to update audit status." }
  }

  // Log status change to audit trail
  const { error: trailError } = await supabase
    .from('audit_trail')
    .insert({
      audit_id: result.data.auditId,
      organization_id: organizationId,
      old_status: audit.status || null,
      new_status: result.data.status,
      changed_by: userId,
      changed_at: updatedAt,
    })

  if (trailError) {
    console.error("Failed to log audit trail:", trailError)
    // Don't fail the operation if trail logging fails
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
  client_id: z.string().uuid(),
  location_id: z.string().uuid(),
})

export async function createAuditFromTemplate(input: {
  title: string
  scheduled_date?: string
  templateId: string
  client_id: string
  location_id: string
}): Promise<{ success: true; auditId: string } | { success: false; error: string }> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const result = CreateAuditFromTemplateSchema.safeParse(input)
  if (!result.success) {
    return { success: false, error: "Missing or invalid data." }
  }

  const { title, scheduled_date, templateId, client_id, location_id } = result.data

  const { data: audit, error: auditError } = await supabase
    .from('audits')
    .insert({
      title,
      status: 'Scheduled',
      scheduled_date: scheduled_date || null,
      organization_id: organizationId,
      client_id,
      location_id,
    })
    .select()
    .single()

  if (auditError || !audit) {
    console.error("Error creating audit:", auditError)
    return { success: false, error: "Unable to create audit." }
  }

  // Snapshot: Copy template questions to checklist items (critical for ISO 9001)
  // Only copy active (non-soft-deleted) questions
  // Each checklist item gets BOTH a snapshot of the question text AND a reference to the source
  const { data: questions } = await supabase
    .from('template_questions')
    .select('*')
    .eq('template_id', templateId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (questions && questions.length > 0) {
    const checklistItems = questions.map(q => ({
      audit_id: audit.id,
      source_question_id: q.id,  // Reference to original template question (audit trail)
      question: q.question,      // Snapshot of question text (what was actually audited)
      organization_id: organizationId,
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

// --- 4. CLONE TEMPLATE FOR CLIENT ---

const CloneTemplateForClientSchema = z.object({
  templateId: z.string().uuid(),
  clientId: z.string().uuid(),
})

export async function cloneTemplateForClient(input: {
  templateId: string
  clientId: string
}): Promise<{ success: true; templateId: string } | { success: false; error: string }> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const result = CloneTemplateForClientSchema.safeParse(input)
  if (!result.success) {
    return { success: false, error: 'Invalid input data.' }
  }

  const { templateId, clientId } = result.data

  // Verify template and client belong to user's organization
  const { data: template } = await supabase
    .from('checklist_templates')
    .select('id, title, description')
    .eq('id', templateId)
    .eq('organization_id', organizationId)
    .single()

  if (!template) {
    return { success: false, error: 'Template not found.' }
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id, name')
    .eq('id', clientId)
    .eq('organization_id', organizationId)
    .single()

  if (!client) {
    return { success: false, error: 'Client not found.' }
  }

  // Create new cloned template
  const newTitle = `${template.title} (${client.name})`
  const { data: newTemplate, error: templateError } = await supabase
    .from('checklist_templates')
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      title: newTitle,
      description: template.description,
    })
    .select()
    .single()

  if (templateError || !newTemplate) {
    console.error('Error cloning template:', templateError)
    return { success: false, error: 'Failed to clone template.' }
  }

  // Copy all questions from original template
  const { data: sourceQuestions } = await supabase
    .from('template_questions')
    .select('question, sort_order')
    .eq('template_id', templateId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (sourceQuestions && sourceQuestions.length > 0) {
    const newQuestions = sourceQuestions.map((q) => ({
      template_id: newTemplate.id,
      organization_id: organizationId,
      question: q.question,
      sort_order: q.sort_order,
    }))

    const { error: questionsError } = await supabase
      .from('template_questions')
      .insert(newQuestions)

    if (questionsError) {
      console.error('Error copying questions:', questionsError)
    }
  }

  revalidatePath('/templates')
  return { success: true, templateId: newTemplate.id }
}
