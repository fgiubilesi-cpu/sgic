import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database.types";

type SamplingRow = Tables<"samplings">;

export interface SamplingListItem extends SamplingRow {
  client_name: string | null;
  location_name: string | null;
  lab_result_count: number;
}

export async function getSamplings(
  organizationId: string,
  clientId?: string,
): Promise<SamplingListItem[]> {
  const supabase = await createClient();

  let query = supabase
    .from("samplings")
    .select("*")
    .eq("organization_id", organizationId)
    .order("sampling_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data: samplings, error } = await query;
  if (error) throw error;

  const samplingIds = (samplings ?? []).map((s) => s.id);
  const clientIds = Array.from(
    new Set((samplings ?? []).map((s) => s.client_id).filter(Boolean)),
  ) as string[];
  const locationIds = Array.from(
    new Set((samplings ?? []).map((s) => s.location_id).filter(Boolean)),
  ) as string[];

  const [
    { data: clients },
    { data: locations },
    { data: labResults },
  ] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("id, name").in("id", clientIds)
      : Promise.resolve({ data: [] }),
    locationIds.length
      ? supabase.from("locations").select("id, name").in("id", locationIds)
      : Promise.resolve({ data: [] }),
    samplingIds.length
      ? supabase.from("lab_results").select("sampling_id").in("sampling_id", samplingIds)
      : Promise.resolve({ data: [] }),
  ]);

  const clientMap = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const locationMap = new Map((locations ?? []).map((l) => [l.id, l.name]));
  const labCountMap = new Map<string, number>();
  for (const lr of labResults ?? []) {
    labCountMap.set(lr.sampling_id, (labCountMap.get(lr.sampling_id) ?? 0) + 1);
  }

  return (samplings ?? []).map((s) => ({
    ...s,
    client_name: s.client_id ? clientMap.get(s.client_id) ?? null : null,
    location_name: s.location_id ? locationMap.get(s.location_id) ?? null : null,
    lab_result_count: labCountMap.get(s.id) ?? 0,
  }));
}
