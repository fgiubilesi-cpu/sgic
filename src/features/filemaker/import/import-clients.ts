import { getFMRecords, FM_LAYOUTS, FM_FIELDS, type FMRecord } from "@/lib/filemaker/fm-client";
import { createClient } from "@/lib/supabase/server";

export interface ImportClientsResult {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

function field(record: FMRecord, key: string): string {
  const val = record.fieldData[key];
  return val !== null && val !== undefined ? String(val).trim() : "";
}

export async function importClientsFromFM(
  organizationId: string
): Promise<ImportClientsResult> {
  const supabase = await createClient();
  const result: ImportClientsResult = { imported: 0, updated: 0, skipped: 0, errors: [] };

  // Fetch existing clients (match on fm_record_id or name+vat)
  const { data: existingClients } = await supabase
    .from("clients")
    .select("id, name, vat_number, fm_record_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  const byFmId = new Map<string, string>(); // fm_record_id → SGIC id
  const byVat = new Map<string, string>(); // vat_number → SGIC id
  for (const c of existingClients ?? []) {
    if (c.fm_record_id) byFmId.set(c.fm_record_id, c.id);
    if (c.vat_number) byVat.set(c.vat_number, c.id);
  }

  const F = FM_FIELDS.clients;
  let records: FMRecord[];
  try {
    records = await getFMRecords(FM_LAYOUTS.clients);
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Errore fetch clienti FM");
    return result;
  }

  for (const rec of records) {
    const fmId = field(rec, F.fm_record_id) || rec.recordId;
    const name = field(rec, F.name);
    if (!name) { result.skipped++; continue; }

    const vat = field(rec, F.vat_number) || null;
    const payload = {
      name,
      address: field(rec, F.address) || null,
      vat_number: vat,
      email: field(rec, F.email) || null,
      phone: field(rec, F.phone) || null,
      fm_record_id: fmId,
      organization_id: organizationId,
    };

    const existingId = byFmId.get(fmId) ?? (vat ? byVat.get(vat) : undefined);

    if (existingId) {
      const { error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", existingId);
      if (error) result.errors.push(`Update cliente "${name}": ${error.message}`);
      else result.updated++;
    } else {
      const { error } = await supabase.from("clients").insert(payload);
      if (error) result.errors.push(`Insert cliente "${name}": ${error.message}`);
      else result.imported++;
    }
  }

  // Import locations after clients (need fresh client map)
  const locResult = await importLocationsFromFM(organizationId);
  result.imported += locResult.imported;
  result.updated += locResult.updated;
  result.skipped += locResult.skipped;
  result.errors.push(...locResult.errors);

  return result;
}

async function importLocationsFromFM(
  organizationId: string
): Promise<ImportClientsResult> {
  const supabase = await createClient();
  const result: ImportClientsResult = { imported: 0, updated: 0, skipped: 0, errors: [] };

  // Refresh client map after import
  const { data: clients } = await supabase
    .from("clients")
    .select("id, fm_record_id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null);

  const clientByFmId = new Map<string, string>();
  for (const c of clients ?? []) {
    if (c.fm_record_id) clientByFmId.set(c.fm_record_id, c.id);
  }

  const { data: existingLoc } = await supabase
    .from("locations")
    .select("id, fm_record_id")
    .eq("organization_id", organizationId);

  const locByFmId = new Map<string, string>();
  for (const l of existingLoc ?? []) {
    if (l.fm_record_id) locByFmId.set(l.fm_record_id, l.id);
  }

  const F = FM_FIELDS.locations;
  let records: FMRecord[];
  try {
    records = await getFMRecords(FM_LAYOUTS.locations);
  } catch (err) {
    result.errors.push(err instanceof Error ? err.message : "Errore fetch sedi FM");
    return result;
  }

  for (const rec of records) {
    const fmId = field(rec, F.fm_record_id) || rec.recordId;
    const name = field(rec, F.name);
    if (!name) { result.skipped++; continue; }

    const clientFmId = field(rec, F.client_fm_id);
    const clientId = clientByFmId.get(clientFmId);
    if (!clientId) { result.skipped++; continue; }

    const payload = {
      name,
      address: field(rec, F.address) || null,
      client_id: clientId,
      fm_record_id: fmId,
      organization_id: organizationId,
    };

    const existingId = locByFmId.get(fmId);
    if (existingId) {
      const { error } = await supabase.from("locations").update(payload).eq("id", existingId);
      if (error) result.errors.push(`Update sede "${name}": ${error.message}`);
      else result.updated++;
    } else {
      const { error } = await supabase.from("locations").insert(payload);
      if (error) result.errors.push(`Insert sede "${name}": ${error.message}`);
      else result.imported++;
    }
  }

  return result;
}
