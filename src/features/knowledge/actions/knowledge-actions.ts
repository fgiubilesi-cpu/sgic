"use server";

import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import {
  buildKnowledgeSearchQuery,
  searchKnowledgeBase,
  type KnowledgeSearchResult,
} from "@/features/knowledge/lib/knowledge-search";

export async function searchKnowledgeDocuments(
  query: string,
  options?: {
    clientId?: string | null;
    limit?: number;
    locationId?: string | null;
    scope?: "all" | "normative";
  }
): Promise<KnowledgeSearchResult[]> {
  return searchKnowledgeBase(query, options);
}

export async function getKnowledgeReferencesForNC(
  nonConformityId: string
): Promise<KnowledgeSearchResult[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { data: nc } = await ctx.supabase
    .from("non_conformities")
    .select(
      `
      id,
      title,
      description,
      audit_id,
      checklist_items:checklist_item_id(question),
      audits:audit_id(client_id, location_id)
    `
    )
    .eq("id", nonConformityId)
    .eq("organization_id", ctx.organizationId)
    .single();

  if (!nc) return [];

  const checklistItem = Array.isArray(nc.checklist_items)
    ? nc.checklist_items[0]
    : nc.checklist_items;
  const audit = Array.isArray(nc.audits) ? nc.audits[0] : nc.audits;

  return searchKnowledgeBase(
    buildKnowledgeSearchQuery([nc.title, nc.description, checklistItem?.question]),
    {
      clientId: audit?.client_id ?? null,
      limit: 4,
      locationId: audit?.location_id ?? null,
      scope: "normative",
    }
  );
}

export async function getKnowledgeReferencesForChecklistItem(input: {
  clientId?: string | null;
  locationId?: string | null;
  question: string;
}): Promise<KnowledgeSearchResult[]> {
  return searchKnowledgeBase(input.question, {
    clientId: input.clientId ?? null,
    limit: 3,
    locationId: input.locationId ?? null,
    scope: "normative",
  });
}
