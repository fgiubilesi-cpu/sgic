import {
  getFMRecords,
  FM_LAYOUTS,
  FM_FIELDS,
  isFMConfigured,
  type FMRecord,
} from "@/lib/filemaker/fm-client";

export interface FMActivity {
  recordId: string;
  type: string;
  date: string;
  status: string;
  notes: string;
}

export interface GetFMActivitiesResult {
  activities: FMActivity[];
  available: boolean; // false se FM non configurata o non raggiungibile
  error?: string;
}

function field(record: FMRecord, key: string): string {
  const val = record.fieldData[key];
  return val !== null && val !== undefined ? String(val).trim() : "";
}

function formatFMDate(val: string): string {
  if (!val) return "—";
  // FM date: MM/DD/YYYY
  const parts = val.split("/");
  if (parts.length === 3) {
    const [mm, dd, yyyy] = parts;
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${yyyy}-${mm}-${dd}`));
  }
  return val;
}

export async function getFMActivitiesByClient(
  clientFmRecordId: string | null
): Promise<GetFMActivitiesResult> {
  if (!isFMConfigured()) {
    return { activities: [], available: false };
  }
  if (!clientFmRecordId) {
    return {
      activities: [],
      available: true,
      error: "Nessun ID FileMaker associato a questo cliente. Esegui prima la sincronizzazione.",
    };
  }

  const F = FM_FIELDS.activities;
  let records: FMRecord[];
  try {
    records = await getFMRecords(FM_LAYOUTS.activities);
  } catch (err) {
    return {
      activities: [],
      available: false,
      error: err instanceof Error ? err.message : "FileMaker non raggiungibile.",
    };
  }

  const activities: FMActivity[] = records
    .filter((rec) => field(rec, F.client_fm_id) === clientFmRecordId)
    .map((rec) => ({
      recordId: rec.recordId,
      type: field(rec, F.type) || "—",
      date: formatFMDate(field(rec, F.date)),
      status: field(rec, F.status) || "—",
      notes: field(rec, F.notes) || "",
    }));

  // Sort by date descending (best effort)
  activities.sort((a, b) => b.date.localeCompare(a.date));

  return { activities, available: true };
}
