import type { DocumentListItem } from "@/features/documents/queries/get-documents";

type DocumentLike = {
  access_url?: string | null;
  category: string | null;
  client_id: string | null;
  description?: string | null;
  expiry_date: string | null;
  ingestion_status: string | null;
  location_id: string | null;
  personnel_id: string | null;
  status: string | null;
  storage_path?: string | null;
  title: string | null;
  version?: number | null;
};

export function getDocumentStatusTone(status: string | null) {
  if (status === "published") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "archived") {
    return "border-zinc-200 bg-zinc-50 text-zinc-500";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export function getDocumentStatusLabel(status: string | null) {
  if (status === "published") return "Pubblicato";
  if (status === "archived") return "Archiviato";
  return "Bozza";
}

export function getDocumentIngestionLabel(status: string | null) {
  if (status === "uploaded") return "Caricato";
  if (status === "parsed") return "Estratto";
  if (status === "review_required") return "Da validare";
  if (status === "reviewed") return "Validato";
  if (status === "linked") return "Collegato";
  if (status === "failed") return "Errore";
  return "Manuale";
}

export function getDocumentExpiryInfo(expiryDate: string | null, now = new Date()) {
  if (!expiryDate) {
    return { label: "Nessuna scadenza", tone: "text-zinc-500" };
  }

  const expiry = new Date(expiryDate);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const in30 = new Date(today);
  in30.setDate(today.getDate() + 30);

  if (expiry < today) {
    return { label: "Scaduto", tone: "text-rose-700" };
  }

  if (expiry <= in30) {
    return { label: "In scadenza", tone: "text-amber-700" };
  }

  return { label: "Valido", tone: "text-emerald-700" };
}

export function formatDocumentReviewAction(action: string | null) {
  if (action === "apply_to_workspace") return "Applicato al workspace";
  if (action === "save_review") return "Salvato review";
  return action ?? "—";
}

export function formatDocumentEntityConfidence(confidence: string | null) {
  if (confidence === "high") {
    return {
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      label: "Alta",
    };
  }

  if (confidence === "medium") {
    return {
      className: "border-amber-200 bg-amber-50 text-amber-700",
      label: "Media",
    };
  }

  return {
    className: "border-zinc-200 bg-zinc-50 text-zinc-500",
    label: "Bassa",
  };
}

export function buildDocumentDetailListItem(input: {
  clientName: string | null;
  document: DocumentLike & Record<string, unknown>;
  entitiesCount: number;
  locationName: string | null;
  personnelName: string | null;
  reviewsCount: number;
  reviewsLastAction: string | null;
  reviewsLastAt: string | null;
  versionsCount: number;
}): DocumentListItem {
  return {
    ...(input.document as unknown as DocumentListItem),
    access_url: null,
    client_name: input.clientName,
    ingestion_status: input.document.ingestion_status ?? "manual",
    last_review_action: input.reviewsLastAction,
    last_reviewed_at: input.reviewsLastAt,
    linked_entity_count: input.entitiesCount,
    location_name: input.locationName,
    personnel_name: input.personnelName,
    review_count: input.reviewsCount,
    version_count: Math.max(
      input.versionsCount,
      input.document.storage_path ? 1 : 0
    ),
  };
}
