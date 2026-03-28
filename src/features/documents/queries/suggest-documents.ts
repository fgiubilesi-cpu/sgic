"use server";

import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export type SuggestedDocument = {
  id: string;
  title: string | null;
  category: string | null;
  client_id: string | null;
};

export async function suggestDocumentsForQuestion(
  question: string,
  clientId?: string | null
): Promise<SuggestedDocument[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { supabase, organizationId } = ctx;

  // Extract meaningful keywords (words longer than 3 chars)
  const keywords = question
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 5);

  if (keywords.length === 0) return [];

  const orClauses = keywords
    .map((kw) => `title.ilike.%${kw}%,description.ilike.%${kw}%`)
    .join(",");

  let query = supabase
    .from("documents")
    .select("id, title, category, client_id")
    .eq("organization_id", organizationId)
    .or(orClauses)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(3);

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data } = await query;
  return data ?? [];
}
