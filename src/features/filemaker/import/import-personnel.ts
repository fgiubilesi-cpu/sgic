import { getFMRecords, FM_LAYOUTS, FM_FIELDS, type FMRecord } from "@/lib/filemaker/fm-client";
import { createClient } from "@/lib/supabase/server";

export interface ImportPersonnelResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function field(record: FMRecord, key: string): string {
  const val = record.fieldData[key];
  return val !== null && val !== undefined ? String(val).trim() : "";
}

function parseDate(val: string): string | null {
  if (!val) return null;
  // FM returns dates as MM/DD/YYYY — convert to YYYY-MM-DD
  const parts = val.split("/");
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }
  // try ISO pass-through
  if (/^\d{4}-\d{2}-\d{2}/.test(val)) return val.slice(0, 10);
  return null;
}

export async function importPersonnelFromFM(
  organizationId: string
): Promise<ImportPersonnelResult> {
  const supabase = await createClient();
  const result: ImportPersonnelResult = { imported: 0, updated: 0, skipped: 0, errors: [] };

  // Build client fm_id → SGIC id map
  const { data: clients } = await supabase
    .from("clients")
    .select("id, fm_record_id")
    .eq("organization_id", organizationId);

  const clientByFmId = new Map<string, string>();
  for (const c of clients ?? []) {
    if (c.fm_record_id) clientByFmId.set(c.fm_record_id, c.id);
  }

  // Existing personnel map
  const { data: existingPersonnel } = await supabase
    .from("personnel")
    .select("id, fm_record_id")
    .eq("organization_id", organizationId);

  const personnelByFmId = new Map<string, string>();
  for (const p of existingPersonnel ?? []) {
    if (p.fm_record_id) personnelByFmId.set(p.fm_record_id, p.id);
  }

  const F = FM_FIELDS.personnel;
  let records: FMRecord[];
  try {
    records = await getFMRecords(FM_LAYOUTS.personnel);
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Errore fetch persone FM");
    return result;
  }

  for (const rec of records) {
    const fmId = field(rec, F.fm_record_id) || rec.recordId;
    const firstName = field(rec, F.first_name);
    const lastName = field(rec, F.last_name);
    if (!firstName && !lastName) { result.skipped++; continue; }

    const clientFmId = field(rec, F.client_fm_id);
    const clientId = clientByFmId.get(clientFmId) ?? null;

    const payload = {
      first_name: firstName || null,
      last_name: lastName || null,
      email: field(rec, F.email) || null,
      role: field(rec, F.role) || null,
      client_id: clientId,
      fm_record_id: fmId,
      organization_id: organizationId,
    };

    const existingId = personnelByFmId.get(fmId);
    if (existingId) {
      const { error } = await supabase.from("personnel").update(payload).eq("id", existingId);
      if (error) result.errors.push(`Update persona "${firstName} ${lastName}": ${error.message}`);
      else result.updated++;
    } else {
      const { data: inserted, error } = await supabase
        .from("personnel")
        .insert(payload)
        .select("id")
        .single();
      if (error) result.errors.push(`Insert persona "${firstName} ${lastName}": ${error.message}`);
      else {
        result.imported++;
        if (inserted) personnelByFmId.set(fmId, inserted.id);
      }
    }
  }

  // Optionally import medical visits
  const visitResult = await importMedicalVisitsFromFM(organizationId, personnelByFmId);
  result.imported += visitResult.imported;
  result.updated += visitResult.updated;
  result.skipped += visitResult.skipped;
  result.errors.push(...visitResult.errors);

  return result;
}

async function importMedicalVisitsFromFM(
  organizationId: string,
  personnelByFmId: Map<string, string>
): Promise<ImportPersonnelResult> {
  const supabase = await createClient();
  const result: ImportPersonnelResult = { imported: 0, updated: 0, skipped: 0, errors: [] };

  // Check if medical visits layout exists — fail gracefully
  const F = FM_FIELDS.medicalVisits;
  let records: FMRecord[];
  try {
    records = await getFMRecords(FM_LAYOUTS.medicalVisits);
  } catch {
    // Layout potrebbe non esistere — skip silenzioso
    return result;
  }

  for (const rec of records) {
    const personnelFmId = field(rec, F.personnel_fm_id);
    const personnelId = personnelByFmId.get(personnelFmId);
    if (!personnelId) { result.skipped++; continue; }

    const visitDate = parseDate(field(rec, F.visit_date));
    const expiryDate = parseDate(field(rec, F.expiry_date));
    if (!visitDate) { result.skipped++; continue; }

    // Check if this visit already exists (match on personnel_id + visit_date)
    const { data: existing } = await supabase
      .from("medical_visits")
      .select("id")
      .eq("personnel_id", personnelId)
      .eq("visit_date", visitDate)
      .eq("organization_id", organizationId)
      .maybeSingle();

    const payload = {
      personnel_id: personnelId,
      visit_date: visitDate,
      expiry_date: expiryDate,
      fitness_status: field(rec, F.fitness_status) || null,
      doctor_name: field(rec, F.doctor_name) || null,
      protocol: field(rec, F.protocol) || null,
      organization_id: organizationId,
    };

    if (existing) {
      const { error } = await supabase.from("medical_visits").update(payload).eq("id", existing.id);
      if (error) result.errors.push(`Update visita medica: ${error.message}`);
      else result.updated++;
    } else {
      const { error } = await supabase.from("medical_visits").insert(payload);
      if (error) result.errors.push(`Insert visita medica: ${error.message}`);
      else result.imported++;
    }
  }

  return result;
}
