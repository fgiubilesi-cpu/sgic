"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { medicalVisitSchema } from "../schemas/medical-visit-schema";
import type { MedicalVisitFormInput } from "../schemas/medical-visit-schema";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createMedicalVisit(
  personnelId: string,
  values: MedicalVisitFormInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const parsed = medicalVisitSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Dati non validi" };
  }

  const { supabase, organizationId } = ctx;

  const { data, error } = await supabase
    .from("medical_visits")
    .insert({
      personnel_id: personnelId,
      organization_id: organizationId,
      visit_date: parsed.data.visit_date,
      expiry_date: parsed.data.expiry_date ?? null,
      fitness_status: parsed.data.fitness_status,
      limitations: parsed.data.limitations ?? null,
      doctor_name: parsed.data.doctor_name ?? null,
      protocol: parsed.data.protocol ?? null,
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/personnel/${personnelId}`);
  return { success: true, data: { id: data.id } };
}

export async function deleteMedicalVisit(
  id: string,
  personnelId: string,
): Promise<ActionResult<null>> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { success: false, error: "Unauthorized" };

  const { supabase } = ctx;

  const { error } = await supabase
    .from("medical_visits")
    .delete()
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/personnel/${personnelId}`);
  return { success: true, data: null };
}
