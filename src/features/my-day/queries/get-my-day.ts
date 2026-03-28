import { getDailyExecutionOverview } from "@/features/clients/queries/get-daily-execution-overview";
import { getUnifiedDeadlines } from "@/features/deadlines/queries/get-unified-deadlines";
import {
  getFullName,
  getRelationName,
  getRelationValue,
  type NamedRelation,
  type Relation,
} from "@/features/dashboard/lib/dashboard-data-utils";
import {
  buildMyDayAgenda,
  type MyDayAgenda,
  type ReviewDocumentSignal,
} from "@/features/my-day/lib/my-day";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";

type ReviewDocumentPersonnelRelation = Relation<{
  first_name: string | null;
  last_name: string | null;
}>;

type ReviewDocumentRow = {
  client: NamedRelation;
  client_id: string | null;
  created_at: string | null;
  id: string;
  ingestion_status: "failed" | "review_required" | string | null;
  location: NamedRelation;
  location_id: string | null;
  personnel: ReviewDocumentPersonnelRelation;
  personnel_id: string | null;
  title: string | null;
  updated_at: string | null;
};

export interface MyDayPayload {
  agenda: MyDayAgenda;
  role: "admin" | "client" | "inspector" | null;
}

function toReviewDocumentSignal(document: ReviewDocumentRow): ReviewDocumentSignal {
  const title = document.title?.trim() || "Documento senza titolo";
  const personnelName = getFullName(
    getRelationValue(document.personnel) ?? null
  );

  return {
    clientName: getRelationName(document.client) || null,
    href: `/documents/${document.id}`,
    id: document.id,
    ingestionStatus:
      document.ingestion_status === "failed" ? "failed" : "review_required",
    locationName: getRelationName(document.location) || null,
    personnelName: document.personnel_id ? personnelName : null,
    title,
    updatedAt: document.updated_at ?? document.created_at ?? null,
  };
}

export async function getMyDayPayload(): Promise<MyDayPayload | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const effectiveClientId =
    ctx.role === "client" ? (ctx.clientId ?? undefined) : undefined;

  let reviewDocumentsQuery = ctx.supabase
    .from("documents")
    .select(
      "id, title, ingestion_status, updated_at, created_at, client_id, location_id, personnel_id, client:client_id(name), location:location_id(name), personnel:personnel_id(first_name, last_name)"
    )
    .eq("organization_id", ctx.organizationId)
    .in("ingestion_status", ["review_required", "failed"])
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false, nullsFirst: false });

  if (effectiveClientId) {
    reviewDocumentsQuery = reviewDocumentsQuery.eq("client_id", effectiveClientId);
  }

  const [dailyExecutionOverview, deadlines, reviewDocumentsResult] = await Promise.all([
    getDailyExecutionOverview(ctx.organizationId, {
      clientId: effectiveClientId,
    }),
    getUnifiedDeadlines({
      clientId: effectiveClientId,
    }),
    reviewDocumentsQuery,
  ]);

  if (reviewDocumentsResult.error) {
    throw reviewDocumentsResult.error;
  }

  const reviewDocuments = ((reviewDocumentsResult.data ?? []) as ReviewDocumentRow[])
    .map((document) => toReviewDocumentSignal(document));

  return {
    agenda: buildMyDayAgenda({
      dailyExecutionOverview,
      deadlines,
      reviewDocuments,
    }),
    role: ctx.role ?? null,
  };
}
