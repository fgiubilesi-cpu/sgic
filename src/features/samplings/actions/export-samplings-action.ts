"use server";

import ExcelJS from "exceljs";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export async function generateSamplingsExcel(
  clientId?: string
): Promise<
  | { success: true; base64: string; filename: string }
  | { success: false; error: string }
> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { success: false, error: "Non autenticato." };
  const { supabase, organizationId } = ctx;

  // 1. Fetch samplings
  let query = supabase
    .from("samplings")
    .select("*")
    .eq("organization_id", organizationId)
    .order("sampling_date", { ascending: false, nullsFirst: false });

  if (clientId) query = query.eq("client_id", clientId);

  const { data: samplings, error } = await query;
  if (error) return { success: false, error: error.message };
  if (!samplings || samplings.length === 0)
    return { success: false, error: "Nessun campionamento da esportare." };

  // 2. Fetch client/location names
  const clientIds = Array.from(
    new Set(samplings.map((s) => s.client_id).filter(Boolean))
  ) as string[];
  const locationIds = Array.from(
    new Set(samplings.map((s) => s.location_id).filter(Boolean))
  ) as string[];
  const samplingIds = samplings.map((s) => s.id);

  const [
    { data: clients },
    { data: locations },
    { data: labResults },
  ] = await Promise.all([
    clientIds.length
      ? supabase
          .from("clients")
          .select("id, name")
          .in("id", clientIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    locationIds.length
      ? supabase.from("locations").select("id, name").in("id", locationIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    supabase
      .from("lab_results")
      .select("id, sampling_id, parameter, uom, result_value, limit_value, outcome")
      .in("sampling_id", samplingIds),
  ]);

  const clientMap = new Map((clients ?? []).map((c) => [c.id, c.name]));
  const locationMap = new Map((locations ?? []).map((l) => [l.id, l.name]));

  // 3. Build workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = "SGIC";

  // ── Sheet 1: Campionamenti ─────────────────────────────────────────────
  const ws1 = wb.addWorksheet("Campionamenti");

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: "FFFFFFFF" } },
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } },
    alignment: { vertical: "middle", horizontal: "center" },
    border: {
      bottom: { style: "thin", color: { argb: "FFBFDBFE" } },
    },
  };

  ws1.columns = [
    { header: "Titolo", key: "title", width: 30 },
    { header: "Matrice", key: "matrix", width: 18 },
    { header: "Data campionamento", key: "sampling_date", width: 20 },
    { header: "Stato", key: "status", width: 14 },
    { header: "Cliente", key: "client", width: 24 },
    { header: "Sede", key: "location", width: 24 },
    { header: "N° risultati lab", key: "results", width: 16 },
  ];

  ws1.getRow(1).eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });
  ws1.getRow(1).height = 22;

  const statusLabel = (s: string | null) => {
    if (s === "completed") return "Completato";
    if (s === "cancelled") return "Annullato";
    return "Pianificato";
  };

  const labCountMap = new Map<string, number>();
  for (const lr of labResults ?? []) {
    labCountMap.set(lr.sampling_id, (labCountMap.get(lr.sampling_id) ?? 0) + 1);
  }

  for (const s of samplings) {
    ws1.addRow({
      title: s.title ?? "",
      matrix: s.matrix ?? "",
      sampling_date: s.sampling_date ?? "",
      status: statusLabel(s.status),
      client: s.client_id ? (clientMap.get(s.client_id) ?? "") : "",
      location: s.location_id ? (locationMap.get(s.location_id) ?? "") : "",
      results: labCountMap.get(s.id) ?? 0,
    });
  }

  // ── Sheet 2: Risultati Lab ─────────────────────────────────────────────
  const ws2 = wb.addWorksheet("Risultati Lab");

  ws2.columns = [
    { header: "Campionamento", key: "sampling", width: 30 },
    { header: "Cliente", key: "client", width: 24 },
    { header: "Parametro", key: "parameter", width: 24 },
    { header: "Valore", key: "result_value", width: 14 },
    { header: "Limite", key: "limit_value", width: 14 },
    { header: "U.M.", key: "uom", width: 10 },
    { header: "Esito", key: "outcome", width: 12 },
  ];

  ws2.getRow(1).eachCell((cell) => {
    Object.assign(cell, headerStyle);
  });
  ws2.getRow(1).height = 22;

  const samplingMap = new Map(samplings.map((s) => [s.id, s]));

  for (const lr of labResults ?? []) {
    const s = samplingMap.get(lr.sampling_id);
    ws2.addRow({
      sampling: s?.title ?? "",
      client: s?.client_id ? (clientMap.get(s.client_id) ?? "") : "",
      parameter: lr.parameter ?? "",
      result_value: lr.result_value ?? "",
      limit_value: lr.limit_value ?? "",
      uom: lr.uom ?? "",
      outcome: lr.outcome ?? "",
    });
  }

  // 4. Serialize
  const buffer = await wb.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `campionamenti_${dateStr}.xlsx`;

  return { success: true, base64, filename };
}
