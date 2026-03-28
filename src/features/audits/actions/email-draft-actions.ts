"use server";

import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import {
  countOpenCorrectiveActions,
  getNonConformityActionSummary,
} from "@/features/quality/lib/quality-process";
import {
  toCanonicalNonConformity,
  toProcessCorrectiveActionShape,
} from "@/features/quality/lib/nc-ac-contract";

type AuditRelationRow = {
  name: string | null;
};

type AuditDraftRow = {
  client: AuditRelationRow | AuditRelationRow[] | null;
  location: AuditRelationRow | AuditRelationRow[] | null;
  scheduled_date: string | null;
  score: number | null;
  title: string | null;
};

type NonConformityDraftRow = {
  description: string | null;
  id: string;
  severity: string | null;
  status: string | null;
  title: string;
};

type CorrectiveActionDraftRow = {
  description: string | null;
  id: string;
  non_conformity_id: string;
  responsible_person_name: string | null;
  status: string | null;
  target_completion_date: string | null;
};

type ChecklistSummaryRow = {
  checklist_items: Array<{ outcome: string | null }> | null;
};

const SEVERITY_LABELS_IT: Record<string, string> = {
  minor: "minore",
  major: "maggiore",
  critical: "critica",
};

const STATUS_LABELS_IT: Record<string, string> = {
  open: "aperta",
  pending_verification: "in attesa di verifica",
  closed: "chiusa",
  cancelled: "annullata",
};

/**
 * Genera una bozza di mail post-audit in italiano formale.
 * Non usa AI — template deterministico dai dati dell'audit.
 */
export async function generateEmailDraft(
  auditId: string
): Promise<{ success: true; text: string } | { success: false; error: string }> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { success: false, error: "Non autenticato." };

  const { supabase, organizationId } = ctx;

  // 1. Fetch audit
  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select(
      "id, title, scheduled_date, score, client:client_id(name), location:location_id(name)"
    )
    .eq("id", auditId)
    .eq("organization_id", organizationId)
    .single();

  if (auditError || !audit) {
    return { success: false, error: "Audit non trovato." };
  }

  // 2. Fetch NCs (only non-cancelled)
  const { data: ncs } = await supabase
    .from("non_conformities")
    .select("id, title, severity, status, description")
    .eq("audit_id", auditId)
    .is("deleted_at", null)
    .neq("status", "cancelled")
    .order("created_at", { ascending: true });

  const nonConformities: NonConformityDraftRow[] = ncs ?? [];

  if (nonConformities.length === 0) {
    return {
      success: false,
      error:
        "Questo audit non ha non conformità attive. La bozza mail è disponibile solo in presenza di NC.",
    };
  }

  // 2b. Fetch corrective actions for all NCs
  const ncIds = nonConformities.map((nonConformity) => nonConformity.id);
  const { data: casData } = await supabase
    .from("corrective_actions")
    .select("id, non_conformity_id, description, responsible_person_name, target_completion_date, status")
    .in("non_conformity_id", ncIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  const correctiveActions: CorrectiveActionDraftRow[] = casData ?? [];

  // 3. Fetch checklist summary
  const { data: checklists } = await supabase
    .from("checklists")
    .select("id, checklist_items(outcome)")
    .eq("audit_id", auditId);

  const allItems = (checklists ?? []).flatMap(
    (checklist: ChecklistSummaryRow) => checklist.checklist_items ?? []
  );
  const total = allItems.length;
  const compliant = allItems.filter((item) => item.outcome === "compliant").length;
  const nonCompliant = allItems.filter((item) => item.outcome === "non_compliant").length;

  // 4. Build email text
  const auditRecord = audit as AuditDraftRow;
  const client = Array.isArray(auditRecord.client) ? auditRecord.client[0] : auditRecord.client;
  const location = Array.isArray(auditRecord.location) ? auditRecord.location[0] : auditRecord.location;
  const auditTitle = auditRecord.title ?? "Audit";
  const clientName = client?.name ?? "Cliente";
  const locationName = location?.name ?? "Sede";
  const score = auditRecord.score != null ? `${Number(auditRecord.score).toFixed(1)}%` : "N/D";
  const dateFormatted = auditRecord.scheduled_date
    ? new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(
        new Date(auditRecord.scheduled_date)
      )
    : new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

  const today = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // Build NC list with operational handling summary
  const ncLines = nonConformities
    .map((nc, idx) => {
      const ncCas = correctiveActions.filter((action) => action.non_conformity_id === nc.id);
      const canonicalNc = toCanonicalNonConformity({
        ...nc,
        corrective_actions: ncCas,
      });
      const processActions = canonicalNc.correctiveActions.map(toProcessCorrectiveActionShape);
      const summary = getNonConformityActionSummary({
        corrective_actions: processActions,
        severity: canonicalNc.severity,
      });
      const openActionCount = countOpenCorrectiveActions(processActions);
      const activeOwner = canonicalNc.correctiveActions.find((action) => action.status !== "completed")?.responsiblePersonName;

      const severityKey = nc.severity ?? "";
      const statusKey = nc.status ?? "";
      const severity = SEVERITY_LABELS_IT[severityKey] ?? severityKey;
      const status = STATUS_LABELS_IT[statusKey] ?? statusKey;
      const desc = canonicalNc.description ? ` ${canonicalNc.description}` : "";
      const owner = activeOwner ? ` Referente operativo: ${activeOwner}.` : "";
      const openActionsLabel =
        openActionCount > 0 ? ` Azioni aperte: ${openActionCount}.` : "";

      return `   ${idx + 1}. ${canonicalNc.title ?? nc.title} [${severity}] — stato: ${status}. ${summary.label}.${summary.detail ? ` ${summary.detail}` : ""}${openActionsLabel}${owner}${desc}`;
    })
    .join("\n");

  const text = `Oggetto: Esito ispezione ${auditTitle} — ${clientName}, ${locationName}

Gentile referente,

a seguito dell'ispezione condotta in data ${dateFormatted} presso la sede di ${locationName} — ${clientName}, Le trasmettiamo il resoconto dell'audit "${auditTitle}".

RIEPILOGO ISPEZIONE
• Totale domande: ${total}
• Risposte conformi: ${compliant} di ${total}
• Non conformità rilevate: ${nonCompliant}
• Score complessivo: ${score}

NON CONFORMITÀ E STATO PRESA IN CARICO
${ncLines}

Come da procedura, Le chiediamo di completare la presa in carico delle non conformità ancora aperte, indicando per ciascuna responsabile e data obiettivo entro 30 giorni dalla data della presente comunicazione.

Il report completo in formato Excel è allegato a questa comunicazione.

Restiamo a disposizione per qualsiasi chiarimento.

Cordiali saluti,

Giubilesi Associati
Ufficio Qualità & Conformità
Data: ${today}
`;

  return { success: true, text };
}
