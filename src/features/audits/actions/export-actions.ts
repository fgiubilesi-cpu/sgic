"use server";

import ExcelJS from "exceljs";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";

/**
 * Genera un file Excel completo per un audit.
 * Fogli: 1) Checklist  2) Non Conformità  3) Azioni Correttive
 * Ritorna il buffer come base64 per passarlo alla route API.
 */
export async function generateAuditExcel(
  auditId: string
): Promise<{ success: true; base64: string; filename: string } | { success: false; error: string }> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { success: false, error: "Non autenticato." };

  const { supabase, organizationId } = ctx;

  // 1. Fetch audit info
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("id, title, scheduled_date, client:client_id(name), location:location_id(name)")
    .eq("id", auditId)
    .eq("organization_id", organizationId)
    .single();

  if (auditError || !audit) {
    return { success: false, error: "Audit non trovato." };
  }

  // 2. Fetch checklist items via checklists
  const { data: checklists } = await supabase
    .from("checklists")
    .select("id, title, checklist_items(id, question, outcome, notes, evidence_url, audio_url)")
    .eq("audit_id", auditId);

  const checklistItems = (checklists ?? []).flatMap((c: any) =>
    (c.checklist_items ?? []).map((item: any, idx: number) => ({
      n: idx + 1,
      checklistTitle: c.title ?? "Checklist",
      question: item.question ?? "",
      outcome: item.outcome ?? "pending",
      notes: item.notes ?? "",
      evidenceUrl: item.evidence_url ?? "",
      audioUrl: item.audio_url ?? "",
    }))
  );

  // 3. Fetch non conformities
  const { data: ncs } = await supabase
    .from("non_conformities")
    .select("id, title, description, severity, status, checklist_items:checklist_item_id(question)")
    .eq("audit_id", auditId)
    .order("created_at", { ascending: true });

  const nonConformities = (ncs ?? []) as any[];

  // 4. Fetch corrective actions for all NCs in this audit
  const ncIds = nonConformities.map((nc) => nc.id);
  let correctiveActions: any[] = [];
  if (ncIds.length > 0) {
    const { data: cas } = await supabase
      .from("corrective_actions")
      .select("id, non_conformity_id, description, responsible_person_name, target_completion_date, status")
      .in("non_conformity_id", ncIds)
      .order("created_at", { ascending: true });
    correctiveActions = (cas ?? []) as any[];
  }

  // --- Build Excel ---
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SGIC";
  workbook.created = new Date();

  const auditTitle = (audit as any).title ?? "Audit";
  const clientName = (audit as any).client?.name ?? "";
  const locationName = (audit as any).location?.name ?? "";
  const scheduledDate = (audit as any).scheduled_date
    ? new Intl.DateTimeFormat("it-IT").format(new Date((audit as any).scheduled_date))
    : "";

  const HEADER_FILL: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1C1C1C" },
  };
  const HEADER_FONT: Partial<ExcelJS.Font> = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  const OUTCOME_COLORS: Record<string, string> = {
    compliant: "FFD1FAE5",       // green-100
    non_compliant: "FFFEE2E2",   // red-100
    not_applicable: "FFF4F4F5",  // zinc-100
    pending: "FFFEF9C3",         // yellow-100
  };
  const OUTCOME_LABELS: Record<string, string> = {
    compliant: "Conforme",
    non_compliant: "Non conforme",
    not_applicable: "N/A",
    pending: "Da compilare",
  };
  const SEVERITY_LABELS: Record<string, string> = {
    minor: "Minore",
    major: "Maggiore",
    critical: "Critica",
  };
  const NC_STATUS_LABELS: Record<string, string> = {
    open: "Aperta",
    pending_verification: "In verifica",
    closed: "Chiusa",
    cancelled: "Annullata",
  };
  const CA_STATUS_LABELS: Record<string, string> = {
    open: "Aperta",
    completed: "Completata",
    verified: "Verificata",
  };

  // ---- Foglio 1: Checklist ----
  const sheet1 = workbook.addWorksheet("Checklist", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet1.columns = [
    { key: "n", width: 5, header: "#" },
    { key: "checklist", width: 18, header: "Checklist" },
    { key: "question", width: 55, header: "Domanda" },
    { key: "outcome", width: 18, header: "Esito" },
    { key: "notes", width: 35, header: "Note" },
    { key: "evidence", width: 25, header: "Allegato foto/video" },
    { key: "audio", width: 25, header: "Nota audio" },
  ];

  // Style header row
  const hRow1 = sheet1.getRow(1);
  hRow1.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: "FF444444" } } };
  });
  hRow1.height = 22;

  // Data rows
  checklistItems.forEach((item) => {
    const row = sheet1.addRow({
      n: item.n,
      checklist: item.checklistTitle,
      question: item.question,
      outcome: OUTCOME_LABELS[item.outcome] ?? item.outcome,
      notes: item.notes,
      evidence: item.evidenceUrl,
      audio: item.audioUrl,
    });
    row.height = 18;

    // Color the outcome cell
    const outcomeCell = row.getCell("outcome");
    const bgColor = OUTCOME_COLORS[item.outcome] ?? "FFFFFFFF";
    outcomeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
    outcomeCell.alignment = { horizontal: "center", vertical: "middle" };
    outcomeCell.font = { size: 10 };

    row.eachCell((cell) => {
      cell.alignment = { ...(cell.alignment ?? {}), vertical: "middle", wrapText: true };
    });
  });

  // ---- Foglio 2: Non Conformità ----
  const sheet2 = workbook.addWorksheet("Non Conformità", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet2.columns = [
    { key: "ncTitle", width: 40, header: "Titolo NC" },
    { key: "severity", width: 14, header: "Gravità" },
    { key: "status", width: 18, header: "Stato" },
    { key: "item", width: 55, header: "Item checklist" },
    { key: "description", width: 50, header: "Descrizione" },
  ];
  const hRow2 = sheet2.getRow(1);
  hRow2.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: "FF444444" } } };
  });
  hRow2.height = 22;

  nonConformities.forEach((nc) => {
    const itemQuestion = Array.isArray(nc.checklist_items)
      ? nc.checklist_items[0]?.question ?? ""
      : nc.checklist_items?.question ?? "";

    const row = sheet2.addRow({
      ncTitle: nc.title ?? "",
      severity: SEVERITY_LABELS[nc.severity] ?? nc.severity,
      status: NC_STATUS_LABELS[nc.status] ?? nc.status,
      item: itemQuestion,
      description: nc.description ?? "",
    });
    row.height = 18;
    row.eachCell((cell) => {
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });

  // ---- Foglio 3: Azioni Correttive ----
  const sheet3 = workbook.addWorksheet("Azioni Correttive", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet3.columns = [
    { key: "ncTitle", width: 35, header: "NC collegata" },
    { key: "description", width: 50, header: "Descrizione AC" },
    { key: "assignedTo", width: 22, header: "Assegnata a" },
    { key: "dueDate", width: 16, header: "Scadenza" },
    { key: "status", width: 16, header: "Stato" },
  ];
  const hRow3 = sheet3.getRow(1);
  hRow3.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = { bottom: { style: "thin", color: { argb: "FF444444" } } };
  });
  hRow3.height = 22;

  correctiveActions.forEach((ca) => {
    const parentNc = nonConformities.find((nc) => nc.id === ca.non_conformity_id);
    const dueDate = ca.target_completion_date
      ? new Intl.DateTimeFormat("it-IT").format(new Date(ca.target_completion_date))
      : "";

    const row = sheet3.addRow({
      ncTitle: parentNc?.title ?? "",
      description: ca.description ?? "",
      assignedTo: ca.responsible_person_name ?? "",
      dueDate,
      status: CA_STATUS_LABELS[ca.status] ?? ca.status,
    });
    row.height = 18;

    // Highlight overdue due dates in red
    if (ca.target_completion_date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(ca.target_completion_date) < today) {
        row.getCell("dueDate").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        row.getCell("dueDate").font = { color: { argb: "FFC00000" }, bold: true };
      }
    }

    row.eachCell((cell) => {
      cell.alignment = { ...(cell.alignment ?? {}), vertical: "middle", wrapText: true };
    });
  });

  // Convert workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const base64 = Buffer.from(buffer).toString("base64");

  const safeName = auditTitle.replace(/[^a-zA-Z0-9_-]/g, "_");
  const filename = `audit_${safeName}_${new Date().toISOString().split("T")[0]}.xlsx`;

  return { success: true, base64, filename };
}
