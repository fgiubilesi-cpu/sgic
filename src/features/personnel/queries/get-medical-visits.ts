import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

type MedicalVisitRow = Tables<"medical_visits">;

export interface MedicalVisitListItem extends MedicalVisitRow {
  personnel_name: string | null;
}

export async function getMedicalVisitsByPersonnel(
  organizationId: string,
  personnelId: string,
): Promise<MedicalVisitRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("medical_visits")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("personnel_id", personnelId)
    .order("visit_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getExpiringMedicalVisits(
  organizationId: string,
  daysAhead: number = 30,
): Promise<MedicalVisitListItem[]> {
  const supabase = await createClient();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const futureDateStr = futureDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("medical_visits")
    .select("*")
    .eq("organization_id", organizationId)
    .not("expiry_date", "is", null)
    .lte("expiry_date", futureDateStr)
    .order("expiry_date");

  if (error) throw error;

  const personnelIds = Array.from(
    new Set((data ?? []).map((v) => v.personnel_id)),
  );

  const { data: personnel } = personnelIds.length
    ? await supabase
        .from("personnel")
        .select("id, first_name, last_name")
        .in("id", personnelIds)
    : { data: [] };

  const personnelMap = new Map(
    (personnel ?? []).map((p) => [
      p.id,
      `${p.first_name} ${p.last_name}`.trim(),
    ]),
  );

  return (data ?? []).map((visit) => ({
    ...visit,
    personnel_name: personnelMap.get(visit.personnel_id) ?? null,
  }));
}
