"use server";

import { getOrganizationContext } from "@/lib/supabase/get-org-context";

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
    .neq("status", "cancelled")
    .order("created_at", { ascending: true });

  const nonConformities = (ncs ?? []) as any[];

  if (nonConformities.length === 0) {
    return {
      success: false,
      error:
        "Questo audit non ha non conformità attive. La bozza mail è disponibile solo in presenza di NC.",
    };
  }

  // 2b. Fetch corrective actions for all NCs
  const ncIds = nonConformities.map((nc: any) => nc.id);
  const { data: casData } = await supabase
    .from("corrective_actions")
    .select("id, non_conformity_id, description, responsible_person_name, target_completion_date, status")
    .in("non_conformity_id", ncIds)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });
  const correctiveActions = (casData ?? []) as any[];

  // 3. Fetch checklist summary
  const { data: checklists } = await supabase
    .from("checklists")
    .select("id, checklist_items(outcome)")
    .eq("audit_id", auditId);

  const allItems = (checklists ?? []).flatMap((c: any) => c.checklist_items ?? []) as any[];
  const total = allItems.length;
  const compliant = allItems.filter((i: any) => i.outcome === "compliant").length;
  const nonCompliant = allItems.filter((i: any) => i.outcome === "non_compliant").length;

  // 4. Build email text
  const auditTitle = (audit as any).title ?? "Audit";
  const clientName = (audit as any).client?.name ?? "Cliente";
  const locationName = (audit as any).location?.name ?? "Sede";
  const score = (audit as any).score != null ? `${Number((audit as any).score).toFixed(1)}%` : "N/D";
  const dateFormatted = (audit as any).scheduled_date
    ? new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(
        new Date((audit as any).scheduled_date)
      )
    : new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long", year: "numeric" }).format(new Date());

  const today = new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const CA_STATUS_LABELS_IT: Record<string, string> = {
    pending: "da avviare",
    in_progress: "in corso",
    completed: "completata",
  };

  // Build NC list with AC
  const ncLines = nonConformities
    .map((nc, idx) => {
      const severity = SEVERITY_LABELS_IT[nc.severity] ?? nc.severity;
      const status = STATUS_LABELS_IT[nc.status] ?? nc.status;
      const desc = nc.description ? ` — ${nc.description}` : "";
      let line = `   ${idx + 1}. ${nc.title} [${severity}] — stato: ${status}${desc}`;

      const ncCas = correctiveActions.filter((ca: any) => ca.non_conformity_id === nc.id);
      if (ncCas.length > 0) {
        const caLines = ncCas.map((ca: any) => {
          const caStatus = CA_STATUS_LABELS_IT[ca.status] ?? ca.status;
          const dueDate = ca.target_completion_date
            ? `, scadenza: ${new Intl.DateTimeFormat("it-IT").format(new Date(ca.target_completion_date))}`
            : "";
          const responsible = ca.responsible_person_name ? `, resp.: ${ca.responsible_person_name}` : "";
          return `      → AC: ${ca.description} [${caStatus}${responsible}${dueDate}]`;
        });
        line += "\n" + caLines.join("\n");
      } else {
        line += "\n      → Nessuna azione correttiva registrata.";
      }

      return line;
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

NON CONFORMITÀ RILEVATE
${ncLines}

Come da procedura, Le chiediamo di predisporre per ciascuna non conformità un piano di azioni correttive con relativo responsabile e scadenza, da trasmettere entro 30 giorni dalla data della presente comunicazione.

Il report completo in formato Excel è allegato a questa comunicazione.

Restiamo a disposizione per qualsiasi chiarimento.

Cordiali saluti,

Giubilesi Associati
Ufficio Qualità & Conformità
Data: ${today}
`;

  return { success: true, text };
}
