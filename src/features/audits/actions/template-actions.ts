'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

type ActionResult = { success: true } | { success: false; error: string }

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
