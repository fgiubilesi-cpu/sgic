'use server';

import { z } from 'zod';
import { getOrganizationContext } from '@/lib/supabase/get-org-context';

const ImportQuestionsSchema = z.object({
  templateId: z.string().uuid(),
  questions: z.array(
    z.object({
      sort_order: z.number().int().positive(),
      question: z.string().min(1),
    })
  ).min(1),
});

export async function importTemplateQuestions(input: {
  templateId: string;
  questions: Array<{ sort_order: number; question: string }>;
}): Promise<{ success: true } | { success: false; error: string }> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { success: false, error: 'Not authenticated.' };

  const { supabase, organizationId } = ctx;

  const result = ImportQuestionsSchema.safeParse(input);
  if (!result.success) {
    return { success: false, error: 'Invalid input data.' };
  }

  const { templateId, questions } = result.data;

  // Verify template belongs to user's organization
  const { data: template } = await supabase
    .from('checklist_templates')
    .select('organization_id')
    .eq('id', templateId)
    .single();

  if (!template || template.organization_id !== organizationId) {
    return { success: false, error: 'Unauthorized.' };
  }

  // Insert questions
  const questionsToInsert = questions.map((q) => ({
    template_id: templateId,
    organization_id: organizationId,
    question: q.question,
    sort_order: q.sort_order,
  }));

  const { error } = await supabase
    .from('template_questions')
    .insert(questionsToInsert);

  if (error) {
    console.error('Import error:', error);
    return { success: false, error: 'Failed to import questions.' };
  }

  return { success: true };
}
