'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getOrganizationContext } from '@/lib/supabase/get-org-context'
import { z } from 'zod'

type ActionResult = { success: true } | { success: false; error: string }
type TemplateResult = { success: true; id: string } | { success: false; error: string }
type OrganizationContext = NonNullable<Awaited<ReturnType<typeof getOrganizationContext>>>
type OrganizationSupabaseClient = OrganizationContext['supabase']

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

type EditableTemplateQuestionInput = {
  id?: string
  question: string
  sortOrder: number
}

const EditableTemplateQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  question: z.string().trim().min(1, 'La domanda non puo essere vuota').max(1000),
  sortOrder: z.number().int().positive(),
})

function revalidateTemplateSurfaces(templateId?: string, auditId?: string) {
  revalidatePath('/templates')
  revalidatePath('/audits')

  if (templateId) {
    revalidatePath(`/templates/${templateId}`)
  }

  if (auditId) {
    revalidatePath(`/audits/${auditId}`)
  }
}

function normalizeQuestions(
  questions: EditableTemplateQuestionInput[] | undefined
): EditableTemplateQuestionInput[] {
  return (questions ?? [])
    .map((question) => ({
      id: question.id,
      question: question.question.trim(),
      sortOrder: question.sortOrder,
    }))
    .filter((question) => question.question.length > 0)
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((question, index) => ({
      ...question,
      sortOrder: index + 1,
    }))
}

async function getTemplateWithQuestions(
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
    .filter((question) => !question.deleted_at)
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))

  return { success: true, data: { ...template, questions } }
}

async function loadTemplateQuestionIds(
  supabase: OrganizationSupabaseClient,
  templateId: string
) {
  const { data, error } = await supabase
    .from('template_questions')
    .select('id')
    .eq('template_id', templateId)
    .is('deleted_at', null)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((question) => String(question.id))
}

async function insertTemplateQuestions(
  supabase: OrganizationSupabaseClient,
  templateId: string,
  questions: EditableTemplateQuestionInput[]
) {
  if (questions.length === 0) return

  const { error } = await supabase.from('template_questions').insert(
    questions.map((question) => ({
      template_id: templateId,
      question: question.question,
      sort_order: question.sortOrder,
    }))
  )

  if (error) {
    throw new Error(error.message)
  }
}

async function loadActiveTemplateQuestionsForCopy(
  supabase: OrganizationSupabaseClient,
  templateId: string
) {
  const { data, error } = await supabase
    .from('template_questions')
    .select('id, question, sort_order, weight')
    .eq('template_id', templateId)
    .is('deleted_at', null)
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function getTemplateWithQuestionsAction(
  templateId: string
): Promise<{ success: true; data: TemplateWithQuestions } | { success: false; error: string }> {
  return getTemplateWithQuestions(templateId)
}

const AddQuestionSchema = z.object({
  templateId: z.string().uuid(),
  question: z.string().trim().min(1, 'Question cannot be empty').max(1000),
})

export async function addTemplateQuestion(
  templateId: string,
  question: string
): Promise<
  | { success: true; question: { id: string; question: string } }
  | { success: false; error: string }
> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    return { success: false, error: 'Not authenticated.' }
  }

  const parsed = AddQuestionSchema.safeParse({ templateId, question })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data.' }
  }

  const { data: currentQuestions, error: currentQuestionsError } = await supabase
    .from('template_questions')
    .select('id')
    .eq('template_id', parsed.data.templateId)
    .is('deleted_at', null)

  if (currentQuestionsError) {
    return { success: false, error: currentQuestionsError.message }
  }

  const { data, error } = await supabase
    .from('template_questions')
    .insert({
      template_id: parsed.data.templateId,
      question: parsed.data.question,
      sort_order: (currentQuestions?.length ?? 0) + 1,
    })
    .select('id, question')
    .single()

  if (error || !data) {
    console.error('Error adding template question:', error)
    return { success: false, error: error?.message ?? 'Failed to add question.' }
  }

  revalidateTemplateSurfaces(parsed.data.templateId)
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

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
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

  revalidateTemplateSurfaces(parsed.data.templateId)
  return { success: true }
}

const CreateTemplateSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(1000).optional(),
  clientId: z.string().uuid().nullable().optional(),
  questions: z.array(EditableTemplateQuestionSchema).optional(),
})

export async function createTemplate(input: {
  title: string
  description?: string
  clientId?: string | null
  questions?: EditableTemplateQuestionInput[]
}): Promise<TemplateResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const parsed = CreateTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data.' }
  }

  const normalizedQuestions = normalizeQuestions(parsed.data.questions)

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

  try {
    await insertTemplateQuestions(supabase, String(data.id), normalizedQuestions)
  } catch (insertError) {
    await supabase.from('checklist_templates').delete().eq('id', data.id)
    return {
      success: false,
      error: insertError instanceof Error ? insertError.message : 'Failed to create template questions.',
    }
  }

  revalidateTemplateSurfaces(String(data.id))
  return { success: true, id: String(data.id) }
}

const SaveTemplateDefinitionSchema = z.object({
  templateId: z.string().uuid(),
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(1000).nullable().optional(),
  clientId: z.string().uuid().nullable().optional(),
  questions: z.array(EditableTemplateQuestionSchema).min(1, 'Add at least one question.'),
})

export async function saveTemplateDefinition(input: {
  templateId: string
  title: string
  description?: string | null
  clientId?: string | null
  questions: EditableTemplateQuestionInput[]
}): Promise<TemplateResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const parsed = SaveTemplateDefinitionSchema.safeParse({
    ...input,
    questions: normalizeQuestions(input.questions),
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid data.' }
  }

  const { data: template, error: templateError } = await supabase
    .from('checklist_templates')
    .select('id')
    .eq('id', parsed.data.templateId)
    .eq('organization_id', organizationId)
    .single()

  if (templateError || !template) {
    return { success: false, error: 'Template not found.' }
  }

  const { error: updateTemplateError } = await supabase
    .from('checklist_templates')
    .update({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      client_id: parsed.data.clientId ?? null,
    })
    .eq('id', parsed.data.templateId)
    .eq('organization_id', organizationId)

  if (updateTemplateError) {
    console.error('Error updating template:', updateTemplateError)
    return { success: false, error: updateTemplateError.message }
  }

  try {
    const existingQuestionIds = await loadTemplateQuestionIds(supabase, parsed.data.templateId)
    const incomingQuestionIds = new Set(
      parsed.data.questions.flatMap((question) => (question.id ? [question.id] : []))
    )
    const questionIdsToDelete = existingQuestionIds.filter(
      (questionId) => !incomingQuestionIds.has(questionId)
    )

    if (questionIdsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('template_questions')
        .update({ deleted_at: new Date().toISOString() })
        .in('id', questionIdsToDelete)
        .eq('template_id', parsed.data.templateId)

      if (deleteError) {
        throw new Error(deleteError.message)
      }
    }

    for (const question of parsed.data.questions) {
      if (!question.id) continue

      const { error: updateQuestionError } = await supabase
        .from('template_questions')
        .update({
          question: question.question,
          sort_order: question.sortOrder,
          deleted_at: null,
        })
        .eq('id', question.id)
        .eq('template_id', parsed.data.templateId)

      if (updateQuestionError) {
        throw new Error(updateQuestionError.message)
      }
    }

    await insertTemplateQuestions(
      supabase,
      parsed.data.templateId,
      parsed.data.questions.filter((question) => !question.id)
    )
  } catch (error) {
    console.error('Error saving template definition:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save template definition.',
    }
  }

  revalidateTemplateSurfaces(parsed.data.templateId)
  return { success: true, id: parsed.data.templateId }
}

const UpdateTemplateSchema = z.object({
  templateId: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(1000).nullable().optional(),
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
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title
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

  revalidateTemplateSurfaces(parsed.data.templateId)
  return { success: true }
}

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

  const [{ count: auditCount }, { count: checklistCount }, { data: questionRows, error: questionsError }] =
    await Promise.all([
      supabase
        .from('audits')
        .select('id', { count: 'exact', head: true })
        .eq('template_id', parsed.data.templateId)
        .eq('organization_id', organizationId),
      supabase
        .from('checklists')
        .select('id', { count: 'exact', head: true })
        .eq('template_id', parsed.data.templateId)
        .eq('organization_id', organizationId),
      supabase
        .from('template_questions')
        .select('id')
        .eq('template_id', parsed.data.templateId),
    ])

  if ((auditCount ?? 0) > 0 || (checklistCount ?? 0) > 0) {
    return { success: false, error: 'Impossibile eliminare un template gia assegnato ad audit o checklist.' }
  }

  if (questionsError) {
    return { success: false, error: questionsError.message }
  }

  const questionIds = (questionRows ?? []).map((question) => String(question.id))
  if (questionIds.length > 0) {
    const { count: historicalUsageCount, error: historyError } = await supabase
      .from('checklist_items')
      .select('id', { count: 'exact', head: true })
      .in('source_question_id', questionIds)

    if (historyError) {
      return { success: false, error: historyError.message }
    }

    if ((historicalUsageCount ?? 0) > 0) {
      return {
        success: false,
        error: 'Impossibile eliminare un template gia usato in audit storici.',
      }
    }
  }

  const { error: deleteQuestionsError } = await supabase
    .from('template_questions')
    .delete()
    .eq('template_id', parsed.data.templateId)

  if (deleteQuestionsError) {
    console.error('Error deleting template questions:', deleteQuestionsError)
    return { success: false, error: deleteQuestionsError.message }
  }

  const { error } = await supabase
    .from('checklist_templates')
    .delete()
    .eq('id', parsed.data.templateId)
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error deleting template:', error)
    return { success: false, error: error.message }
  }

  revalidateTemplateSurfaces(parsed.data.templateId)
  return { success: true }
}

const UpdateQuestionSchema = z.object({
  questionId: z.string().uuid(),
  templateId: z.string().uuid(),
  question: z.string().trim().min(1).max(1000),
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

  const { supabase } = ctx

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

  revalidateTemplateSurfaces(parsed.data.templateId)
  return { success: true }
}

const ReorderSchema = z.object({
  templateId: z.string().uuid(),
  questions: z
    .array(
      z.object({
        id: z.string().uuid(),
        sortOrder: z.number().int().positive(),
      })
    )
    .min(1),
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

  const { error } = await supabase
    .from('template_questions')
    .upsert(
      parsed.data.questions.map((question) => ({
        id: question.id,
        sort_order: question.sortOrder,
      })),
      { onConflict: 'id' }
    )

  if (error) {
    console.error('Error reordering questions:', error)
    return { success: false, error: error.message }
  }

  revalidateTemplateSurfaces(parsed.data.templateId)
  return { success: true }
}

const DuplicateTemplateSchema = z.object({
  templateId: z.string().uuid(),
})

export async function duplicateTemplate(templateId: string): Promise<TemplateResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const parsed = DuplicateTemplateSchema.safeParse({ templateId })
  if (!parsed.success) {
    return { success: false, error: 'Invalid data.' }
  }

  const { data: template, error: templateError } = await supabase
    .from('checklist_templates')
    .select('id, title, description, client_id')
    .eq('id', parsed.data.templateId)
    .eq('organization_id', organizationId)
    .single()

  if (templateError || !template) {
    return { success: false, error: 'Template not found.' }
  }

  const questions = await loadActiveTemplateQuestionsForCopy(supabase, parsed.data.templateId)

  const { data: newTemplate, error: insertTemplateError } = await supabase
    .from('checklist_templates')
    .insert({
      organization_id: organizationId,
      title: `${template.title} (copia)`,
      description: template.description,
      client_id: template.client_id,
    })
    .select('id')
    .single()

  if (insertTemplateError || !newTemplate) {
    return { success: false, error: insertTemplateError?.message ?? 'Failed to duplicate template.' }
  }

  try {
    await insertTemplateQuestions(
      supabase,
      String(newTemplate.id),
      questions.map((question, index) => ({
        question: question.question ?? '',
        sortOrder: question.sort_order ?? index + 1,
      }))
    )
  } catch (error) {
    await supabase.from('checklist_templates').delete().eq('id', newTemplate.id)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to duplicate template questions.',
    }
  }

  revalidateTemplateSurfaces(String(newTemplate.id))
  return { success: true, id: String(newTemplate.id) }
}

const SwitchAuditTemplateSchema = z.object({
  auditId: z.string().uuid(),
  templateId: z.string().uuid(),
})

export async function switchAuditTemplate(input: {
  auditId: string
  templateId: string
}): Promise<ActionResult> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const parsed = SwitchAuditTemplateSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: 'Invalid data.' }
  }

  const { data: audit, error: auditError } = await supabase
    .from('audits')
    .select('id, title, status, template_id')
    .eq('id', parsed.data.auditId)
    .eq('organization_id', organizationId)
    .single()

  if (auditError || !audit) {
    return { success: false, error: 'Audit non trovato.' }
  }

  if (audit.status !== 'Scheduled') {
    return {
      success: false,
      error: 'Il template puo essere cambiato solo su audit ancora pianificati.',
    }
  }

  const { data: template, error: templateError } = await supabase
    .from('checklist_templates')
    .select('id, title')
    .eq('id', parsed.data.templateId)
    .eq('organization_id', organizationId)
    .single()

  if (templateError || !template) {
    return { success: false, error: 'Template non trovato.' }
  }

  const { data: checklists, error: checklistsError } = await supabase
    .from('checklists')
    .select('id, created_at')
    .eq('audit_id', parsed.data.auditId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true })

  if (checklistsError) {
    return { success: false, error: checklistsError.message }
  }

  const checklistIds = (checklists ?? []).map((checklist) => String(checklist.id))
  if (checklistIds.length > 0) {
    const { data: checklistItems, error: itemsError } = await supabase
      .from('checklist_items')
      .select('id, outcome, notes, evidence_url, audio_url')
      .in('checklist_id', checklistIds)

    if (itemsError) {
      return { success: false, error: itemsError.message }
    }

    const hasCompiledItems = (checklistItems ?? []).some((item) => {
      const notes = typeof item.notes === 'string' ? item.notes.trim() : ''
      return (
        item.outcome !== null &&
        item.outcome !== 'pending'
      ) || notes.length > 0 || Boolean(item.evidence_url) || Boolean(item.audio_url)
    })

    if (hasCompiledItems) {
      return {
        success: false,
        error: 'Questo audit contiene gia risposte o note: cambia template solo prima di iniziare la compilazione.',
      }
    }
  }

  const [{ count: mediaCount, error: mediaError }, { count: ncCount, error: ncError }] =
    await Promise.all([
      supabase
        .from('checklist_item_media')
        .select('id', { count: 'exact', head: true })
        .eq('audit_id', parsed.data.auditId)
        .eq('organization_id', organizationId),
      supabase
        .from('non_conformities')
        .select('id', { count: 'exact', head: true })
        .eq('audit_id', parsed.data.auditId)
        .eq('organization_id', organizationId)
        .is('deleted_at', null),
    ])

  if (mediaError) {
    return { success: false, error: mediaError.message }
  }

  if (ncError) {
    return { success: false, error: ncError.message }
  }

  if ((mediaCount ?? 0) > 0 || (ncCount ?? 0) > 0) {
    return {
      success: false,
      error: 'Questo audit contiene gia evidenze o non conformita: il cambio template non e piu sicuro.',
    }
  }

  const templateQuestions = await loadActiveTemplateQuestionsForCopy(supabase, parsed.data.templateId)

  const primaryChecklistId = checklistIds[0] ?? null
  const extraChecklistIds = checklistIds.slice(1)

  if (checklistIds.length > 0) {
    const { error: deleteItemsError } = await supabase
      .from('checklist_items')
      .delete()
      .in('checklist_id', checklistIds)

    if (deleteItemsError) {
      return { success: false, error: deleteItemsError.message }
    }
  }

  if (extraChecklistIds.length > 0) {
    const { error: deleteChecklistsError } = await supabase
      .from('checklists')
      .delete()
      .in('id', extraChecklistIds)

    if (deleteChecklistsError) {
      return { success: false, error: deleteChecklistsError.message }
    }
  }

  let checklistId = primaryChecklistId

  if (!checklistId) {
    const { data: newChecklist, error: createChecklistError } = await supabase
      .from('checklists')
      .insert({
        audit_id: parsed.data.auditId,
        organization_id: organizationId,
        title: template.title,
        template_id: parsed.data.templateId,
      })
      .select('id')
      .single()

    if (createChecklistError || !newChecklist) {
      return {
        success: false,
        error: createChecklistError?.message ?? 'Impossibile creare la checklist del nuovo template.',
      }
    }

    checklistId = String(newChecklist.id)
  } else {
    const { error: updateChecklistError } = await supabase
      .from('checklists')
      .update({
        title: template.title,
        template_id: parsed.data.templateId,
      })
      .eq('id', checklistId)
      .eq('organization_id', organizationId)

    if (updateChecklistError) {
      return { success: false, error: updateChecklistError.message }
    }
  }

  if (templateQuestions.length > 0) {
    const { error: insertItemsError } = await supabase
      .from('checklist_items')
      .insert(
        templateQuestions.map((question, index) => ({
          checklist_id: checklistId,
          source_question_id: question.id,
          question: question.question,
          organization_id: organizationId,
          outcome: 'pending',
          sort_order: question.sort_order ?? index + 1,
        }))
      )

    if (insertItemsError) {
      return { success: false, error: insertItemsError.message }
    }
  }

  const { error: updateAuditError } = await supabase
    .from('audits')
    .update({ template_id: parsed.data.templateId })
    .eq('id', parsed.data.auditId)
    .eq('organization_id', organizationId)

  if (updateAuditError) {
    return { success: false, error: updateAuditError.message }
  }

  revalidateTemplateSurfaces(parsed.data.templateId, parsed.data.auditId)
  if (audit.template_id && audit.template_id !== parsed.data.templateId) {
    revalidateTemplateSurfaces(audit.template_id, parsed.data.auditId)
  }

  return { success: true }
}
