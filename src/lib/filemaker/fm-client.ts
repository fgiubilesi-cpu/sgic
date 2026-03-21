/**
 * FileMaker Data API v2 client
 *
 * Configurazione in .env.local:
 *   FM_HOST=your-fm-server.giubilesi.it
 *   FM_DATABASE=GEA_DB
 *   FM_USERNAME=fm_api_user
 *   FM_PASSWORD=fm_api_password
 *
 * Endpoint base: https://{FM_HOST}/fmi/data/v2/databases/{FM_DATABASE}
 */

const FM_HOST = process.env.FM_HOST;
const FM_DATABASE = process.env.FM_DATABASE;
const FM_USERNAME = process.env.FM_USERNAME;
const FM_PASSWORD = process.env.FM_PASSWORD;

export class FMConfigError extends Error {
  constructor() {
    super("FileMaker Data API non configurata. Verifica FM_HOST, FM_DATABASE, FM_USERNAME, FM_PASSWORD in .env.local.");
    this.name = "FMConfigError";
  }
}

export class FMConnectionError extends Error {
  constructor(detail?: string) {
    super(`FileMaker non raggiungibile${detail ? `: ${detail}` : "."}`);
    this.name = "FMConnectionError";
  }
}

function getBaseUrl(): string {
  if (!FM_HOST || FM_HOST === "your-fm-server.giubilesi.it") {
    throw new FMConfigError();
  }
  if (!FM_DATABASE || !FM_USERNAME || !FM_PASSWORD) {
    throw new FMConfigError();
  }
  return `https://${FM_HOST}/fmi/data/v2/databases/${encodeURIComponent(FM_DATABASE)}`;
}

export function isFMConfigured(): boolean {
  return (
    !!FM_HOST &&
    FM_HOST !== "your-fm-server.giubilesi.it" &&
    !!FM_DATABASE &&
    !!FM_USERNAME &&
    !!FM_PASSWORD
  );
}

// ─── Session token ────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const baseUrl = getBaseUrl();
  const credentials = Buffer.from(`${FM_USERNAME}:${FM_PASSWORD}`).toString("base64");

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      body: "{}",
      // short timeout
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    throw new FMConnectionError(err instanceof Error ? err.message : undefined);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new FMConnectionError(`HTTP ${res.status} — ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as { response?: { token?: string } };
  const token = json.response?.token;
  if (!token) throw new FMConnectionError("Token non ricevuto.");
  return token;
}

async function deleteSession(token: string): Promise<void> {
  const baseUrl = getBaseUrl();
  try {
    await fetch(`${baseUrl}/sessions/${token}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    // non fatale
  }
}

// ─── Generic record fetch ─────────────────────────────────────────────────────

export interface FMRecord {
  fieldData: Record<string, string | number | null>;
  recordId: string;
  modId: string;
}

export async function getFMRecords(
  layout: string,
  options: { limit?: number; offset?: number } = {}
): Promise<FMRecord[]> {
  const baseUrl = getBaseUrl();
  const token = await getToken();

  const params = new URLSearchParams();
  params.set("_limit", String(options.limit ?? 1000));
  if (options.offset) params.set("_offset", String(options.offset));

  let res: Response;
  try {
    res = await fetch(
      `${baseUrl}/layouts/${encodeURIComponent(layout)}/records?${params}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(30_000),
      }
    );
  } catch (err) {
    await deleteSession(token);
    throw new FMConnectionError(err instanceof Error ? err.message : undefined);
  }

  await deleteSession(token);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new FMConnectionError(`HTTP ${res.status} layout "${layout}" — ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as {
    response?: { data?: FMRecord[] };
  };
  return json.response?.data ?? [];
}

// ─── FileMaker layout names (aggiusta secondo il tuo DB) ──────────────────────
// Questi sono i nomi dei layout nel tuo database FM. Modificali se necessario.

export const FM_LAYOUTS = {
  clients: "Clienti",
  locations: "UnitaOperative",
  personnel: "Persone",
  medicalVisits: "VisiteMediche",
  activities: "AttivitaGA",
} as const;

// ─── Field mappings ───────────────────────────────────────────────────────────
// Ogni oggetto mappa: chiave SGIC → nome campo FileMaker
// Modifica i valori (a destra) per farli corrispondere ai tuoi campi FM

export const FM_FIELDS = {
  clients: {
    name: "Nome",
    address: "Indirizzo",
    city: "Citta",
    vat_number: "PartitaIVA",
    fiscal_code: "CodiceFiscale",
    email: "Email",
    phone: "Telefono",
    fm_record_id: "ID_Cliente", // campo ID univoco in FM
  },
  locations: {
    name: "NomeUnita",
    address: "IndirizzoUnita",
    client_fm_id: "ID_Cliente", // FK verso Clienti
    fm_record_id: "ID_Unita",
  },
  personnel: {
    first_name: "Nome",
    last_name: "Cognome",
    email: "Email",
    role: "Mansione",
    client_fm_id: "ID_Cliente",
    fm_record_id: "ID_Persona",
  },
  medicalVisits: {
    personnel_fm_id: "ID_Persona",
    visit_date: "DataVisita",
    expiry_date: "DataScadenza",
    fitness_status: "Idoneita",
    doctor_name: "MedicoCompetente",
    protocol: "Protocollo",
  },
  activities: {
    type: "TipoAttivita",
    date: "DataAttivita",
    status: "Stato",
    notes: "Note",
    client_fm_id: "ID_Cliente",
  },
} as const;
