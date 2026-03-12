'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getOrganizationContext } from '@/lib/supabase/get-org-context'
import { createTemplate } from './template-actions'

export const importTemplateModeValues = ['create', 'append', 'replace'] as const
export type ImportTemplateMode = (typeof importTemplateModeValues)[number]

const ImportedQuestionSchema = z.object({
  sort_order: z.number().int().positive(),
  question: z.string().trim().min(1),
})

const ImportQuestionsSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('create'),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(1000).optional(),
    questions: z.array(ImportedQuestionSchema).min(1),
  }),
  z.object({
    mode: z.literal('append'),
    templateId: z.string().uuid(),
    questions: z.array(ImportedQuestionSchema).min(1),
  }),
  z.object({
    mode: z.literal('replace'),
    templateId: z.string().uuid(),
    questions: z.array(ImportedQuestionSchema).min(1),
  }),
])

function normalizeImportedQuestions(
  questions: Array<{ sort_order: number; question: string }>
): Array<{ sort_order: number; question: string }> {
  return questions
    .map((question) => ({
      sort_order: question.sort_order,
      question: question.question.trim(),
    }))
    .filter((question) => question.question.length > 0)
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((question, index) => ({
      sort_order: index + 1,
      question: question.question,
    }))
}

export async function importTemplateQuestions(
  input:
    | {
        mode: 'create'
        title: string
        description?: string
        questions: Array<{ sort_order: number; question: string }>
      }
    | {
        mode: 'append' | 'replace'
        templateId: string
        questions: Array<{ sort_order: number; question: string }>
      }
): Promise<
  | { success: true; templateId: string; importedCount: number; mode: ImportTemplateMode }
  | { success: false; error: string }
> {
  const ctx = await getOrganizationContext()
  if (!ctx) return { success: false, error: 'Not authenticated.' }

  const { supabase, organizationId } = ctx

  const normalizedInput =
    input.mode === 'create'
      ? { ...input, questions: normalizeImportedQuestions(input.questions) }
      : { ...input, questions: normalizeImportedQuestions(input.questions) }

  const result = ImportQuestionsSchema.safeParse(normalizedInput)
  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? 'Invalid input data.' }
  }

  if (result.data.mode === 'create') {
    const createResult = await createTemplate({
      title: result.data.title,
      description: result.data.description,
      questions: result.data.questions.map((question) => ({
        question: question.question,
        sortOrder: question.sort_order,
      })),
    })

    if (!createResult.success) {
      return createResult
    }

    return {
      success: true,
      templateId: createResult.id,
      importedCount: result.data.questions.length,
      mode: result.data.mode,
    }
  }

  const templateId = result.data.templateId

  const { data: template, error: templateError } = await supabase
    .from('checklist_templates')
    .select('id')
    .eq('id', templateId)
    .eq('organization_id', organizationId)
    .single()

  if (templateError || !template) {
    return { success: false, error: 'Template non trovato o non accessibile.' }
  }

  let offset = 0

  if (result.data.mode === 'replace') {
    const { error: replaceError } = await supabase
      .from('template_questions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('template_id', templateId)
      .is('deleted_at', null)

    if (replaceError) {
      console.error('Template replace error:', replaceError)
      return { success: false, error: 'Failed to replace current questions.' }
    }
  } else {
    const { count, error: countError } = await supabase
      .from('template_questions')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', templateId)
      .is('deleted_at', null)

    if (countError) {
      return { success: false, error: countError.message }
    }

    offset = count ?? 0
  }

  const questionsToInsert = result.data.questions.map((question, index) => ({
    template_id: templateId,
    question: question.question,
    sort_order: offset + index + 1,
  }))

  const { error } = await supabase.from('template_questions').insert(questionsToInsert)

  if (error) {
    console.error('Import error:', error)
    return { success: false, error: 'Failed to import questions.' }
  }

  revalidatePath('/templates')
  revalidatePath(`/templates/${templateId}`)
  revalidatePath('/audits')

  return {
    success: true,
    templateId,
    importedCount: result.data.questions.length,
    mode: result.data.mode,
  }
}
