import type { DocumentIntakeProposal } from "@/features/documents/lib/document-intelligence";
import { documentIntakeProposalSchema } from "@/features/documents/schemas/document-intake-schema";

export type DocumentSuggestionStatus = "needs_context" | "ready";
export type DocumentSuggestionTone = "default" | "warning";

export interface DocumentActionSuggestion {
  description: string;
  id: string;
  status: DocumentSuggestionStatus;
  title: string;
  tone: DocumentSuggestionTone;
}

export interface DocumentActionSuggestionDocument {
  category: string | null;
  client_id: string | null;
  expiry_date: string | null;
  ingestion_status: string | null;
  linked_entity_count: number;
  title: string | null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function compact(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function needsContext(document: DocumentActionSuggestionDocument) {
  return !document.client_id;
}

function suggestionStatus(document: DocumentActionSuggestionDocument): DocumentSuggestionStatus {
  return needsContext(document) ? "needs_context" : "ready";
}

function suggestionTone(status: DocumentSuggestionStatus): DocumentSuggestionTone {
  return status === "needs_context" ? "warning" : "default";
}

function withContextWarning(
  document: DocumentActionSuggestionDocument,
  description: string
) {
  if (!needsContext(document)) return description;
  return `${description} Collega prima un cliente al documento per applicare la suggestion al workspace.`;
}

export function extractDocumentIntakeProposal(payload: unknown): DocumentIntakeProposal | null {
  const payloadObject = asObject(payload);
  const candidate = payloadObject?.proposal ?? payload;
  const parsed = documentIntakeProposalSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

export function buildDocumentActionSuggestions(input: {
  document: DocumentActionSuggestionDocument;
  proposal: DocumentIntakeProposal | null;
}): DocumentActionSuggestion[] {
  const { document, proposal } = input;
  if (!proposal) {
    return [];
  }

  const status = suggestionStatus(document);
  const tone = suggestionTone(status);
  const suggestions: DocumentActionSuggestion[] = [];

  if (proposal.contract) {
    const contractType = compact(proposal.contract.contract_type);
    const renewalDate = compact(proposal.contract.renewal_date);
    const scope = compact(proposal.contract.service_scope);
    suggestions.push({
      description: withContextWarning(
        document,
        [
          contractType ? `Tipo ${contractType}.` : null,
          renewalDate ? `Rinnovo ${renewalDate}.` : null,
          scope ? `Scope: ${scope}.` : null,
        ]
          .filter(Boolean)
          .join(" ") || "Aggiorna o conferma i dati contrattuali proposti."
      ),
      id: "contract",
      status,
      title: "Aggiorna dati contrattuali",
      tone,
    });
  }

  const validServiceLines = proposal.service_lines?.filter(
    (line) => compact(line.title) !== ""
  ) ?? [];
  if (validServiceLines.length > 0) {
    suggestions.push({
      description: withContextWarning(
        document,
        `${validServiceLines.length} righe di servizio pronte per essere confermate o rifinite.`
      ),
      id: "service-lines",
      status,
      title:
        validServiceLines.length === 1
          ? "Proponi 1 linea servizio"
          : `Proponi ${validServiceLines.length} linee servizio`,
      tone,
    });
  }

  const validContacts = proposal.contacts?.filter(
    (contact) => compact(contact.full_name) !== ""
  ) ?? [];
  if (document.category === "OrgChart" && validContacts.length > 0) {
    suggestions.push({
      description: withContextWarning(
        document,
        `${validContacts.length} contatti o ruoli rilevati da usare per organigramma o referenti.`
      ),
      id: "contacts",
      status,
      title:
        validContacts.length === 1
          ? "Aggiorna 1 contatto"
          : `Aggiorna ${validContacts.length} contatti`,
      tone,
    });
  }

  const suggestedDueDate =
    compact(proposal.deadline?.due_date) ||
    compact(proposal.manual?.review_date) ||
    compact(proposal.contract?.renewal_date) ||
    compact(document.expiry_date);

  if (suggestedDueDate) {
    suggestions.push({
      description: withContextWarning(
        document,
        `${compact(proposal.deadline?.title) || "Scadenza proposta"} con data ${suggestedDueDate}.`
      ),
      id: "deadline",
      status,
      title: "Crea o aggiorna una scadenza",
      tone,
    });
  }

  if (compact(proposal.summary) !== "") {
    suggestions.push({
      description: withContextWarning(
        document,
        proposal.summary
      ),
      id: "followup",
      status,
      title: "Genera un task di follow-up",
      tone,
    });
  }

  if (suggestions.length === 0 && document.ingestion_status === "review_required") {
    suggestions.push({
      description:
        "Il parser non ha prodotto suggestion forti. Usa la review per normalizzare il contenuto e decidere se applicarlo al workspace.",
      id: "review",
      status: "ready",
      title: "Rivedi manualmente l'intake",
      tone: "default",
    });
  }

  return suggestions;
}
