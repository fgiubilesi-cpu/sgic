import "server-only";

import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import type { Tables } from "@/types/database.types";

type DocumentRow = Tables<"documents">;
type DocumentCategory = NonNullable<DocumentRow["category"]>;

const STOPWORDS = new Set([
  "agli",
  "alla",
  "alle",
  "allo",
  "anche",
  "come",
  "con",
  "dai",
  "dal",
  "dalla",
  "dalle",
  "dei",
  "del",
  "della",
  "delle",
  "dello",
  "dove",
  "fra",
  "gli",
  "hai",
  "haccp",
  "il",
  "in",
  "la",
  "le",
  "lo",
  "nel",
  "nella",
  "nelle",
  "nello",
  "per",
  "piu",
  "poi",
  "quale",
  "quali",
  "quando",
  "quanto",
  "questa",
  "queste",
  "questi",
  "questo",
  "sono",
  "sua",
  "sue",
  "sugli",
  "sui",
  "sul",
  "sulla",
  "sulle",
  "tra",
  "una",
  "uno",
  "violata",
  "violato",
]);

const NORMATIVE_CATEGORIES = [
  "Procedure",
  "Manual",
  "Instruction",
  "Form",
  "Authorization",
  "Registry",
  "Report",
] as const;

const CATEGORY_PRIORITY: Partial<Record<DocumentCategory, number>> = {
  Procedure: 8,
  Manual: 7,
  Instruction: 6,
  Form: 4,
  Authorization: 4,
  Registry: 3,
  Report: 2,
  Certificate: 1,
  Contract: 1,
  OrgChart: 1,
  Other: 0,
};

type SearchContext = Awaited<ReturnType<typeof getOrganizationContext>>;

type SearchDocumentRow = Pick<
  DocumentRow,
  | "category"
  | "client_id"
  | "description"
  | "expiry_date"
  | "id"
  | "location_id"
  | "organization_id"
  | "status"
  | "title"
  | "updated_at"
>;

type SearchMatchSource = "description" | "extracted_text" | "title";

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  category: DocumentRow["category"];
  client_id: string | null;
  location_id: string | null;
  href: string;
  score: number;
  snippet: string;
  sectionLabel: string | null;
  matchSource: SearchMatchSource;
  expiryDate: string | null;
  updatedAt: string | null;
}

export interface KnowledgeSearchOptions {
  clientId?: string | null;
  limit?: number;
  locationId?: string | null;
  scope?: "all" | "normative";
}

function sanitizeSearchTerm(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[%_,]/g, " ")
    .replace(/[^\p{L}\p{N}\s./-]+/gu, " ")
    .replace(/\s+/g, " ");
}

function extractSearchTerms(rawQuery: string) {
  return Array.from(
    new Set(
      sanitizeSearchTerm(rawQuery)
        .split(/\s+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 3 && !STOPWORDS.has(term))
    )
  ).slice(0, 8);
}

function buildSearchFragments(rawQuery: string) {
  const normalizedQuery = sanitizeSearchTerm(rawQuery);
  const terms = extractSearchTerms(rawQuery);
  const fragments = Array.from(
    new Set([normalizedQuery, ...terms].filter((term) => term.length >= 2))
  );
  return { normalizedQuery, terms, fragments };
}

function buildSnippet(text: string, terms: string[], contextChars = 100) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return "";

  const lowerText = cleanText.toLowerCase();
  const firstMatchIndex = terms.reduce<number>((best, term) => {
    const idx = lowerText.indexOf(term.toLowerCase());
    if (idx === -1) return best;
    if (best === -1) return idx;
    return Math.min(best, idx);
  }, -1);

  if (firstMatchIndex === -1) {
    return cleanText.slice(0, contextChars * 2).trim();
  }

  const start = Math.max(0, firstMatchIndex - contextChars);
  const end = Math.min(cleanText.length, firstMatchIndex + contextChars);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < cleanText.length ? "…" : "";
  return `${prefix}${cleanText.slice(start, end).trim()}${suffix}`;
}

function extractSectionLabel(text: string, terms: string[]) {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (!cleanText) return null;

  const lowerText = cleanText.toLowerCase();
  const matchIndex = terms.reduce<number>((best, term) => {
    const idx = lowerText.indexOf(term.toLowerCase());
    if (idx === -1) return best;
    if (best === -1) return idx;
    return Math.min(best, idx);
  }, -1);

  const windowStart = matchIndex === -1 ? 0 : Math.max(0, matchIndex - 160);
  const windowEnd =
    matchIndex === -1 ? Math.min(cleanText.length, 240) : Math.min(cleanText.length, matchIndex + 160);
  const windowText = cleanText.slice(windowStart, windowEnd);

  const labelMatch = windowText.match(
    /(art\.?\s*\d+[a-z0-9./-]*|articolo\s+\d+[a-z0-9./-]*|sezione\s+[a-z0-9./-]+|capitolo\s+[a-z0-9./-]+|par(?:\.|agrafo)\s*[a-z0-9./-]+|punto\s+[a-z0-9./-]+)/i
  );

  return labelMatch ? labelMatch[0] : null;
}

function countTokenMatches(text: string, terms: string[]) {
  const haystack = text.toLowerCase();
  return terms.reduce((count, term) => (haystack.includes(term.toLowerCase()) ? count + 1 : count), 0);
}

function selectMatchSource(
  document: SearchDocumentRow,
  extractedText: string,
  query: string,
  terms: string[]
): SearchMatchSource {
  const title = document.title ?? "";
  const description = document.description ?? "";
  const queryLower = query.toLowerCase();

  if (title.toLowerCase().includes(queryLower) || countTokenMatches(title, terms) > 0) {
    return "title";
  }

  if (
    description.toLowerCase().includes(queryLower) ||
    countTokenMatches(description, terms) > 0
  ) {
    return "description";
  }

  return "extracted_text";
}

function computeKnowledgeScore(params: {
  clientId?: string | null;
  document: SearchDocumentRow;
  extractedText: string;
  locationId?: string | null;
  query: string;
  terms: string[];
}) {
  const { clientId, document, extractedText, locationId, query, terms } = params;
  const queryLower = query.toLowerCase();
  const title = (document.title ?? "").toLowerCase();
  const description = (document.description ?? "").toLowerCase();
  const text = extractedText.toLowerCase();

  let score = 0;

  if (title.includes(queryLower)) score += 18;
  if (description.includes(queryLower)) score += 10;
  if (text.includes(queryLower)) score += 14;

  const titleMatches = countTokenMatches(title, terms);
  const descriptionMatches = countTokenMatches(description, terms);
  const textMatches = countTokenMatches(text, terms);

  score += titleMatches * 5;
  score += descriptionMatches * 3;
  score += textMatches * 2;

  if (clientId && document.client_id === clientId) score += 5;
  if (locationId && document.location_id === locationId) score += 4;
  if (!document.client_id) score += 1;
  if (!document.location_id) score += 1;
  if (document.status === "published") score += 2;

  const categoryPriority =
    document.category ? CATEGORY_PRIORITY[document.category as DocumentCategory] ?? 0 : 0;
  score += categoryPriority;

  return score;
}

function withinScope(
  document: SearchDocumentRow,
  clientId?: string | null,
  locationId?: string | null
) {
  const matchesClient = !clientId || !document.client_id || document.client_id === clientId;
  const matchesLocation =
    !locationId || !document.location_id || document.location_id === locationId;

  return matchesClient && matchesLocation;
}

async function searchKnowledgeBaseWithContext(
  ctx: NonNullable<SearchContext>,
  rawQuery: string,
  options: KnowledgeSearchOptions = {}
): Promise<KnowledgeSearchResult[]> {
  const { normalizedQuery, terms, fragments } = buildSearchFragments(rawQuery);
  if (!normalizedQuery || fragments.length === 0) return [];

  const limit = Math.min(Math.max(options.limit ?? 5, 1), 20);
  const effectiveClientId = ctx.role === "client" ? ctx.clientId ?? null : options.clientId ?? null;
  const effectiveLocationId = options.locationId ?? null;

  const documentOrFilter = fragments
    .flatMap((term) => [`title.ilike.%${term}%`, `description.ilike.%${term}%`])
    .join(",");

  const textOrFilter = fragments.map((term) => `extracted_text.ilike.%${term}%`).join(",");
  const scopedCategories =
    options.scope === "normative" ? [...NORMATIVE_CATEGORIES] : null;

  let documentsQuery = ctx.supabase
    .from("documents")
    .select("id, title, description, category, client_id, location_id, expiry_date, updated_at, status, organization_id")
    .eq("organization_id", ctx.organizationId)
    .limit(limit * 4);

  if (documentOrFilter) {
    documentsQuery = documentsQuery.or(documentOrFilter);
  }

  if (scopedCategories) {
    documentsQuery = documentsQuery.in("category", scopedCategories as unknown as string[]);
  }

  let ingestionQuery = ctx.supabase
    .from("document_ingestions")
    .select("document_id, extracted_text, created_at")
    .eq("organization_id", ctx.organizationId)
    .limit(limit * 12)
    .order("created_at", { ascending: false });

  if (textOrFilter) {
    ingestionQuery = ingestionQuery.or(textOrFilter);
  }

  const [{ data: documents }, { data: ingestionMatches }] = await Promise.all([
    documentsQuery,
    ingestionQuery,
  ]);

  const extractedTextByDocumentId = new Map<string, string>();
  for (const match of ingestionMatches ?? []) {
    if (!match.document_id || extractedTextByDocumentId.has(match.document_id)) continue;
    extractedTextByDocumentId.set(match.document_id, match.extracted_text ?? "");
  }

  const baseDocuments = documents ?? [];
  const knownDocumentIds = new Set(baseDocuments.map((document) => document.id));

  const extraDocumentIds = Array.from(extractedTextByDocumentId.keys()).filter(
    (documentId) => !knownDocumentIds.has(documentId)
  );

  let extraDocuments: SearchDocumentRow[] = [];
  if (extraDocumentIds.length > 0) {
    let extraQuery = ctx.supabase
      .from("documents")
      .select("id, title, description, category, client_id, location_id, expiry_date, updated_at, status, organization_id")
      .eq("organization_id", ctx.organizationId)
      .in("id", extraDocumentIds);

    if (scopedCategories) {
      extraQuery = extraQuery.in("category", scopedCategories as unknown as string[]);
    }

    const { data } = await extraQuery;
    extraDocuments = data ?? [];
  }

  return [...baseDocuments, ...extraDocuments]
    .filter((document) => withinScope(document, effectiveClientId, effectiveLocationId))
    .map((document) => {
      const extractedText = extractedTextByDocumentId.get(document.id) ?? "";
      const score = computeKnowledgeScore({
        clientId: effectiveClientId,
        document,
        extractedText,
        locationId: effectiveLocationId,
        query: normalizedQuery,
        terms,
      });

      const matchSource = selectMatchSource(document, extractedText, normalizedQuery, terms);
      const snippetSource =
        matchSource === "title"
          ? document.description || extractedText || document.title || ""
          : matchSource === "description"
            ? document.description || extractedText || document.title || ""
            : extractedText || document.description || document.title || "";

      return {
        id: document.id,
        title: document.title?.trim() || "Documento",
        category: document.category,
        client_id: document.client_id,
        location_id: document.location_id,
        href: `/documents/${document.id}`,
        score,
        snippet: buildSnippet(snippetSource, [normalizedQuery, ...terms]),
        sectionLabel: extractSectionLabel(extractedText || document.description || "", [
          normalizedQuery,
          ...terms,
        ]),
        matchSource,
        expiryDate: document.expiry_date,
        updatedAt: document.updated_at,
      } satisfies KnowledgeSearchResult;
    })
    .filter((result) => result.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "");
    })
    .slice(0, limit);
}

export function buildKnowledgeSearchQuery(parts: Array<string | null | undefined>) {
  return parts
    .flatMap((part) => (part ? [part.trim()] : []))
    .filter(Boolean)
    .join(" · ");
}

export async function searchKnowledgeBase(
  rawQuery: string,
  options: KnowledgeSearchOptions = {}
): Promise<KnowledgeSearchResult[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  return searchKnowledgeBaseWithContext(ctx, rawQuery, options);
}

export function getNormativeKnowledgeCategories() {
  return [...NORMATIVE_CATEGORIES];
}
