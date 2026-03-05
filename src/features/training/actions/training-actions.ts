"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { trainingCourseSchema, type TrainingCourse } from "../schemas/training-courses.schema";
import { trainingRecordSchema, type TrainingRecord } from "../schemas/training-records.schema";

export async function createTrainingCourse(values: TrainingCourse): Promise<void> {
  const validated = trainingCourseSchema.parse(values);
  const ctx = await getOrganizationContext();
  if (!ctx) throw new Error("Unauthorized");

  const { supabase, organizationId } = ctx;

  const { error } = await supabase.from("training_courses").insert({
    title: validated.title,
    duration_hours: validated.duration_hours,
    validity_months: validated.validity_months ?? null,
    category: validated.category,
    organization_id: organizationId,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/training");
}

export async function createTrainingRecord(values: TrainingRecord): Promise<void> {
  const validated = trainingRecordSchema.parse(values);
  const ctx = await getOrganizationContext();
  if (!ctx) throw new Error("Unauthorized");

  const { supabase, organizationId } = ctx;

  const { error } = await supabase.from("training_records").insert({
    personnel_id: validated.personnel_id,
    course_id: validated.course_id,
    completion_date: validated.completion_date,
    expiry_date: validated.expiry_date ?? null,
    certificate_url: validated.certificate_url ?? null,
    organization_id: organizationId,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/training");
}
