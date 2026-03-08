import { getOrganizationContext } from "@/lib/supabase/get-org-context";

type TrainingRecordRow = {
  id: string;
  personnel_id: string;
  course_id: string;
  organization_id: string;
  completion_date: string;
  expiry_date: string | null;
  certificate_url: string | null;
  created_at: string | null;
  training_courses?: { title: string; duration_hours: number | null; category: string | null } | null;
};

export interface PersonnelDetail {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  tax_code: string;
  hire_date: string;
  organization_id: string;
  training_records: TrainingRecordRow[];
}

export async function getPersonnelDetail(id: string): Promise<PersonnelDetail | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const { supabase, organizationId } = ctx;

  const { data, error } = await supabase
    .from("personnel")
    .select(
      "id, first_name, last_name, role, is_active, tax_code, hire_date, organization_id, training_records(id, personnel_id, course_id, completion_date, expiry_date, certificate_url, organization_id, training_courses(title, duration_hours, category))"
    )
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (error || !data) return null;

  return data as unknown as PersonnelDetail;
}
