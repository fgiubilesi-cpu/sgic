import { createClient } from '@/lib/supabase/server'

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

export async function getTemplateWithQuestions(templateId: string): Promise<TemplateWithQuestions | null> {
  const supabase = await createClient()

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

  if (error || !template) return null

  const questions = (template.template_questions as TemplateQuestion[])
    .filter(q => !q.deleted_at)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  return { ...template, questions }
}
