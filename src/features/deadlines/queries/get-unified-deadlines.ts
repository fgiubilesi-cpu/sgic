import { createClient } from "@/lib/supabase/server";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export type DeadlineType =
  | "medical"
  | "training"
  | "audit"
  | "document"
  | "corrective_action";

export type DeadlineUrgency = "overdue" | "warning30" | "warning90" | "ok";

export interface UnifiedDeadline {
  id: string;
  type: DeadlineType;
  title: string;
  description: string;
  clientName: string;
  personnelName?: string;
  dueDate: string; // YYYY-MM-DD
  daysUntil: number;
  urgency: DeadlineUrgency;
  href: string;
}

export interface DeadlineFilters {
  clientId?: string;
}

function calcDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function classifyUrgency(daysUntil: number): DeadlineUrgency {
  if (daysUntil < 0) return "overdue";
  if (daysUntil <= 30) return "warning30";
  if (daysUntil <= 90) return "warning90";
  return "ok";
}

export async function getUnifiedDeadlines(
  filters: DeadlineFilters
): Promise<UnifiedDeadline[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];
  const { supabase, organizationId, role, clientId: userClientId } = ctx;

  // If role is client, force filter by their client_id
  const effectiveClientId =
    role === "client" ? (userClientId ?? null) : (filters.clientId ?? null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const past = new Date(today);
  past.setFullYear(past.getFullYear() - 1);
  const future = new Date(today);
  future.setDate(future.getDate() + 90);
  const pastStr = past.toISOString().split("T")[0];
  const futureStr = future.toISOString().split("T")[0];

  const results: UnifiedDeadline[] = [];

  // ── 1. Visite mediche ─────────────────────────────────────────────────────
  {
    const { data: visits } = await supabase
      .from("medical_visits")
      .select(
        "id, expiry_date, personnel:personnel_id(id, first_name, last_name, client_id, client:client_id(name))"
      )
      .eq("organization_id", organizationId)
      .not("expiry_date", "is", null)
      .gte("expiry_date", pastStr)
      .lte("expiry_date", futureStr);

    for (const v of visits ?? []) {
      const p = v.personnel as unknown as Record<string, unknown> | null;
      if (!p) continue;
      if (effectiveClientId && p.client_id !== effectiveClientId) continue;
      const clientName =
        ((p.client as unknown as Record<string, unknown> | null)?.name as string) ?? "—";
      const daysUntil = calcDaysUntil(v.expiry_date as string);
      results.push({
        id: `medical-${v.id}`,
        type: "medical",
        title: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Collaboratore",
        description: "Scadenza idoneità medica",
        clientName,
        personnelName:
          `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || undefined,
        dueDate: v.expiry_date as string,
        daysUntil,
        urgency: classifyUrgency(daysUntil),
        href: `/personnel/${p.id as string}`,
      });
    }
  }

  // ── 2. Attestati formazione ────────────────────────────────────────────────
  {
    const { data: records } = await supabase
      .from("training_records")
      .select(
        "id, expiry_date, personnel:personnel_id(id, first_name, last_name, client_id, client:client_id(name)), course:course_id(title)"
      )
      .eq("organization_id", organizationId)
      .not("expiry_date", "is", null)
      .gte("expiry_date", pastStr)
      .lte("expiry_date", futureStr);

    for (const r of records ?? []) {
      const p = r.personnel as unknown as Record<string, unknown> | null;
      const course = r.course as unknown as Record<string, unknown> | null;
      if (!p) continue;
      if (effectiveClientId && p.client_id !== effectiveClientId) continue;
      const clientName =
        ((p.client as unknown as Record<string, unknown> | null)?.name as string) ?? "—";
      const daysUntil = calcDaysUntil(r.expiry_date as string);
      results.push({
        id: `training-${r.id}`,
        type: "training",
        title: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "Collaboratore",
        description: (course?.title as string) ?? "Corso di formazione",
        clientName,
        personnelName:
          `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || undefined,
        dueDate: r.expiry_date as string,
        daysUntil,
        urgency: classifyUrgency(daysUntil),
        href: `/personnel/${p.id as string}`,
      });
    }
  }

  // ── 3. Audit programmati (non completati) ─────────────────────────────────
  {
    let q = supabase
      .from("audits")
      .select("id, title, scheduled_date, client:client_id(name)")
      .eq("organization_id", organizationId)
      .neq("status", "completed")
      .not("scheduled_date", "is", null)
      .gte("scheduled_date", `${pastStr}T00:00:00`)
      .lte("scheduled_date", `${futureStr}T23:59:59`);

    if (effectiveClientId) q = q.eq("client_id", effectiveClientId);

    const { data: audits } = await q;
    for (const a of audits ?? []) {
      const clientName =
        ((a.client as unknown as Record<string, unknown> | null)?.name as string) ?? "—";
      const dateStr = (a.scheduled_date as string).split("T")[0];
      const daysUntil = calcDaysUntil(dateStr);
      results.push({
        id: `audit-${a.id}`,
        type: "audit",
        title: (a.title as string) ?? "Audit",
        description: "Audit programmato",
        clientName,
        dueDate: dateStr,
        daysUntil,
        urgency: classifyUrgency(daysUntil),
        href: `/audits/${a.id}`,
      });
    }
  }

  // ── 4. Documenti con scadenza ─────────────────────────────────────────────
  {
    let q = supabase
      .from("documents")
      .select("id, title, expiry_date, client:client_id(name)")
      .eq("organization_id", organizationId)
      .not("expiry_date", "is", null)
      .gte("expiry_date", pastStr)
      .lte("expiry_date", futureStr);

    if (effectiveClientId) q = q.eq("client_id", effectiveClientId);

    const { data: docs } = await q;
    for (const d of docs ?? []) {
      const clientName =
        ((d.client as unknown as Record<string, unknown> | null)?.name as string) ?? "—";
      const daysUntil = calcDaysUntil(d.expiry_date as string);
      results.push({
        id: `document-${d.id}`,
        type: "document",
        title: (d.title as string) ?? "Documento",
        description: "Scadenza documento",
        clientName,
        dueDate: d.expiry_date as string,
        daysUntil,
        urgency: classifyUrgency(daysUntil),
        href: `/documents/${d.id}`,
      });
    }
  }

  // ── 5. Azioni correttive (non completate, con due_date) ───────────────────
  {
    const { data: cas } = await supabase
      .from("corrective_actions")
      .select(
        `id, description, due_date,
         non_conformity:non_conformity_id(
           audit:audit_id(
             id, title, client_id,
             client:client_id(name)
           )
         )`
      )
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .neq("status", "completed")
      .not("due_date", "is", null)
      .gte("due_date", pastStr)
      .lte("due_date", futureStr);

    for (const ca of cas ?? []) {
      const nc = ca.non_conformity as unknown as Record<string, unknown> | null;
      const audit = nc?.audit as unknown as Record<string, unknown> | null;
      if (!audit) continue;
      const clientName =
        ((audit.client as unknown as Record<string, unknown> | null)?.name as string) ??
        "—";
      const clientId = audit.client_id as string | null;
      if (effectiveClientId && clientId !== effectiveClientId) continue;
      const daysUntil = calcDaysUntil(ca.due_date as string);
      results.push({
        id: `ca-${ca.id}`,
        type: "corrective_action",
        title: (audit.title as string) ?? "Audit",
        description: (ca.description as string) ?? "Azione correttiva",
        clientName,
        dueDate: ca.due_date as string,
        daysUntil,
        urgency: classifyUrgency(daysUntil),
        href: `/audits/${audit.id as string}`,
      });
    }
  }

  // Sort: più urgente prima (overdue ordinati da più vecchio a più recente)
  results.sort((a, b) => a.daysUntil - b.daysUntil);

  return results;
}
