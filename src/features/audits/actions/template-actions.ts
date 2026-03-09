'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getOrganizationContext } from '@/lib/supabase/get-org-context'
import { z } from 'zod'

type ActionResult = { success: true } | { success: false; error: string }
type TemplateResult = { success: true; id: string } | { success: false; error: string }

// ============================================
// GET TEMPLATE WITH QUESTIONS (Server Action — chiamabile da client)
// ============================================

export interface TemplateQuestion {
  id: string
  question: string
  sort_order: number | null
  weight: number | null
  deleted_at: string | null
}

export interface TemplateWithQuestions {
  id: string
  title: string
  description: string | null
  organization_id: string | null
  client_id: string | null
  questions: TemplateQuestion[]
}

export async function getTemplateWithQuestionsAction(
  templateId: string
): Promise<{ success: true; data: TemplateWithQuestions } | { success: false; error: string }> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase } = ctx

  const { data: template, error } = await supabase
    .from('checklist_templates')
    .select(`
      id, title, description, organization_id, client_id,
      template_questions!template_questions_template_id_fkey(
        id, question, sort_order, weight, deleted_at
      )
    `)
    .eq('id', templateId)
    .single()

  if (error || !template) {
    return { success: false, error: error?.message ?? 'Template not found.' }
  }

  const questions = (template.template_questions as TemplateQuestion[])
    .filter(q => !q.deleted_at)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return { success: true, data: { ...template, questions } }
}

const AddQuestionSchema = z.object({
  templateId: z.string().uuid(),
  question: z.string().min(1, 'Question cannot be empty').max(1000),
})

export async function addTemplateQuestion(
  templateId: string,
  question: string
): Promise<
  | { success: true; question: { id: string; question: string } }
  | { success: false; error: string }
> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const parsed = AddQuestionSchema.safeParse({ templateId, question: question.trim() })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data.' }
  }

  const { data, error } = await supabase
    .from('template_questions')
    .insert({ template_id: parsed.data.templateId, question: parsed.data.question })
    .select('id, question')
    .single()

  if (error || !data) {
    console.error('Error adding template question:', error)
    return { success: false, error: error?.message ?? 'Failed to add question.' }
  }

  revalidatePath(`/templates/${templateId}`)
  return { success: true, question: { id: String(data.id), question: data.question ?? '' } }
}

const DeleteQuestionSchema = z.object({
  questionId: z.string().uuid(),
  templateId: z.string().uuid(),
})

export async function softDeleteTemplateQuestion(
  questionId: string,
  templateId: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const parsed = DeleteQuestionSchema.safeParse({ questionId, templateId })
  if (!parsed.success) {
    return { success: false, error: 'Invalid data.' }
  }

  const { error } = await supabase
    .from('template_questions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', parsed.data.questionId)
    .eq('template_id', parsed.data.templateId)

  if (error) {
    console.error('Error soft-deleting template question:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/templates/${templateId}`)
  return { success: true }
}

// ============================================
// CREATE TEMPLATE
// ============================================

const CreateTemplateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  clientId: z.string().uuid().nullable().optional(),
})

export async function createTemplate(input: {
  title: string
  description?: string
  clientId?: string | null
}): Promise<TemplateResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const parsed = CreateTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data.' }
  }

  const { data, error } = await supabase
    .from('checklist_templates')
    .insert({
      organization_id: organizationId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      client_id: parsed.data.clientId || null,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('Error creating template:', error)
    return { success: false, error: error?.message ?? 'Failed to create template.' }
  }

  revalidatePath('/audits')
  return { success: true, id: String(data.id) }
}

// ============================================
// UPDATE TEMPLATE
// ============================================

const UpdateTemplateSchema = z.object({
  templateId: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  clientId: z.string().uuid().nullable().optional(),
})

export async function updateTemplate(input: {
  templateId: string
  title?: string
  description?: string | null
  clientId?: string | null
}): Promise<ActionResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const parsed = UpdateTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Invalid data.' }
  }

  const updateData: Record<string, unknown> = {}
  if (parsed.data.title) updateData.title = parsed.data.title
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description
  if (parsed.data.clientId !== undefined) updateData.client_id = parsed.data.clientId

  const { error } = await supabase
    .from('checklist_templates')
    .update(updateData)
    .eq('id', parsed.data.templateId)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error updating template:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/audits')
  return { success: true }
}

// ============================================
// DELETE TEMPLATE
// ============================================

const DeleteTemplateSchema = z.object({
  templateId: z.string().uuid(),
})

export async function deleteTemplate(templateId: string): Promise<ActionResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const parsed = DeleteTemplateSchema.safeParse({ templateId })
  if (!parsed.success) {
    return { success: false, error: 'Invalid data.' }
  }

  // Check if template is used by any audits
  const { count } = await supabase
    .from('audits')
    .select('id', { count: 'exact', head: true })
    .eq('template_id', parsed.data.templateId)

  if ((count ?? 0) > 0) {
    return { success: false, error: 'Cannot delete template in use by audits.' }
  }

  // Soft delete template_questions
  await supabase
    .from('template_questions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('template_id', parsed.data.templateId)

  // Delete template
  const { error } = await supabase
    .from('checklist_templates')
    .delete()
    .eq('id', parsed.data.templateId)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error deleting template:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/audits')
  return { success: true }
}

// ============================================
// UPDATE TEMPLATE QUESTION
// ============================================

const UpdateQuestionSchema = z.object({
  questionId: z.string().uuid(),
  templateId: z.string().uuid(),
  question: z.string().min(1).max(1000),
  sortOrder: z.number().int().positive(),
})

export async function updateTemplateQuestion(input: {
  questionId: string
  templateId: string
  question: string
  sortOrder: number
}): Promise<ActionResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const parsed = UpdateQuestionSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data.' }
  }

  const { error } = await supabase
    .from('template_questions')
    .update({
      question: parsed.data.question,
      sort_order: parsed.data.sortOrder,
    })
    .eq('id', parsed.data.questionId)
    .eq('template_id', parsed.data.templateId)

  if (error) {
    console.error('Error updating template question:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/audits`)
  return { success: true }
}

// ============================================
// REORDER QUESTIONS
// ============================================

const ReorderSchema = z.object({
  templateId: z.string().uuid(),
  questions: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int().positive(),
    })
  ).min(1),
})

export async function reorderTemplateQuestions(input: {
  templateId: string
  questions: Array<{ id: string; sortOrder: number }>
}): Promise<ActionResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase } = ctx

  const parsed = ReorderSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Invalid data.' }
  }

  // Update all questions in one go using upsert pattern
  const { error } = await supabase
    .from('template_questions')
    .upsert(
      parsed.data.questions.map((q) => ({
        id: q.id,
        sort_order: q.sortOrder,
      })),
      { onConflict: 'id' }
    )

  if (error) {
    console.error('Error reordering questions:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/audits`)
  return { success: true }
}
