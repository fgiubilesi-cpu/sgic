import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database.types';

export interface CourseRegistration {
  id: string;
  personnelId: string;
  personnelName: string;
  clientName: string;
  completionDate: string;
  expiryDate: string | null;
  daysUntil: number | null;
  urgency: 'overdue' | 'warning' | 'ok' | 'none';
}

export async function getCourseRegistrations(
  organizationId: string,
  courseId: string,
): Promise<CourseRegistration[]> {
  const supabase = await createClient();

  type PersonnelCourseRow = {
    client: { name?: string | null } | Array<{ name?: string | null }> | null;
    first_name: string | null;
    id: string;
    last_name: string | null;
  };

  const getClientName = (
    relation: PersonnelCourseRow["client"],
  ): string => {
    const client = Array.isArray(relation) ? relation[0] : relation;
    return client?.name ?? '';
  };

  const { data: records, error } = await supabase
    .from('training_records')
    .select('id, personnel_id, completion_date, expiry_date')
    .eq('organization_id', organizationId)
    .eq('course_id', courseId)
    .order('completion_date', { ascending: false });

  if (error || !records || records.length === 0) return [];

  const personnelIds = Array.from(new Set(records.map((r) => r.personnel_id)));
  const { data: personnel } = await supabase
    .from('personnel')
    .select('id, first_name, last_name, client_id, client:client_id(name)')
    .in('id', personnelIds);

  const personMap = new Map<string, { name: string; clientName: string }>(
    ((personnel ?? []) as PersonnelCourseRow[]).map((person) => [
      person.id,
      {
        name: `${person.first_name ?? ''} ${person.last_name ?? ''}`.trim(),
        clientName: getClientName(person.client),
      },
    ]),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return records.map((r) => {
    const person = personMap.get(r.personnel_id);
    let daysUntil: number | null = null;
    let urgency: CourseRegistration['urgency'] = 'none';

    if (r.expiry_date) {
      const exp = new Date(r.expiry_date);
      daysUntil = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil < 0) urgency = 'overdue';
      else if (daysUntil <= 30) urgency = 'warning';
      else urgency = 'ok';
    }

    return {
      id: r.id,
      personnelId: r.personnel_id,
      personnelName: person?.name ?? '—',
      clientName: person?.clientName ?? '',
      completionDate: r.completion_date,
      expiryDate: r.expiry_date,
      daysUntil,
      urgency,
    };
  });
}

type TrainingCourse = Tables<'training_courses'>;

export async function getTrainingCourses(
  organizationId: string,
  clientId?: string,
): Promise<TrainingCourse[]> {
  const supabase = await createClient();

  let query = supabase
    .from('training_courses')
    .select('*')
    .eq('organization_id', organizationId)
    .order('title');

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data ?? [];
}

export interface TrainingRecordWithCourse {
  id: string;
  personnel_id: string;
  course_id: string;
  completion_date: string;
  expiry_date: string | null;
  course_title: string;
  personnel_name: string;
}

export async function getTrainingRecords(
  organizationId: string,
  clientId?: string,
): Promise<TrainingRecordWithCourse[]> {
  const supabase = await createClient();

  let personnelQuery = supabase
    .from('personnel')
    .select('id, first_name, last_name')
    .eq('organization_id', organizationId);

  if (clientId) {
    personnelQuery = personnelQuery.eq('client_id', clientId);
  }

  const { data: personnel, error: personnelError } = await personnelQuery;
  if (personnelError) throw personnelError;
  if (!personnel || personnel.length === 0) return [];

  const personnelIds = personnel.map((p) => p.id);
  const personnelMap = new Map(
    personnel.map((p) => [p.id, `${p.first_name} ${p.last_name}`.trim()]),
  );

  const { data: records, error: recordsError } = await supabase
    .from('training_records')
    .select('id, personnel_id, course_id, completion_date, expiry_date')
    .eq('organization_id', organizationId)
    .in('personnel_id', personnelIds)
    .order('completion_date', { ascending: false });

  if (recordsError) throw recordsError;

  const courseIds = Array.from(new Set((records ?? []).map((r) => r.course_id)));
  const { data: courses } = courseIds.length
    ? await supabase.from('training_courses').select('id, title').in('id', courseIds)
    : { data: [] };

  const courseMap = new Map((courses ?? []).map((c) => [c.id, c.title]));

  return (records ?? []).map((r) => ({
    id: r.id,
    personnel_id: r.personnel_id,
    course_id: r.course_id,
    completion_date: r.completion_date,
    expiry_date: r.expiry_date,
    course_title: courseMap.get(r.course_id) ?? "Corso sconosciuto",
    personnel_name: personnelMap.get(r.personnel_id) ?? "—",
  }));
}
