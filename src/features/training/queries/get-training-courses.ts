import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database.types';

type TrainingCourse = Tables<'training_courses'>;

export async function getTrainingCourses(organizationId: string): Promise<TrainingCourse[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('training_courses')
    .select('*')
    .eq('organization_id', organizationId)
    .order('title');

  if (error) throw error;

  return data ?? [];
}
