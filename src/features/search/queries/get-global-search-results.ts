import { createClient } from "@/lib/supabase/server";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { searchKnowledgeBase } from "@/features/knowledge/lib/knowledge-search";

type SearchResultItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  meta?: string;
};

export interface GlobalSearchResults {
  audits: SearchResultItem[];
  clients: SearchResultItem[];
  documents: SearchResultItem[];
  locations: SearchResultItem[];
  personnel: SearchResultItem[];
}

function sanitizeSearchTerm(value: string) {
  return value.trim().replace(/[%_,]/g, " ");
}

export async function getGlobalSearchResults(rawQuery: string): Promise<GlobalSearchResults> {
  const query = sanitizeSearchTerm(rawQuery);
  if (!query || query.length < 2) {
    return {
      audits: [],
      clients: [],
      documents: [],
      locations: [],
      personnel: [],
    };
  }

  const ctx = await getOrganizationContext();
  if (!ctx) {
    return {
      audits: [],
      clients: [],
      documents: [],
      locations: [],
      personnel: [],
    };
  }

  const supabase = await createClient();
  const ilikeTerm = `%${query}%`;

  let clientsQuery = supabase
    .from("clients")
    .select("id, name, email, vat_number")
    .eq("organization_id", ctx.organizationId)
    .ilike("name", ilikeTerm)
    .limit(6);

  let locationsQuery = supabase
    .from("locations")
    .select("id, name, address, client_id")
    .eq("organization_id", ctx.organizationId)
    .ilike("name", ilikeTerm)
    .limit(6);

  let personnelQuery = supabase
    .from("personnel")
    .select("id, first_name, last_name, email, client_id")
    .eq("organization_id", ctx.organizationId)
    .or(`first_name.ilike.${ilikeTerm},last_name.ilike.${ilikeTerm},email.ilike.${ilikeTerm}`)
    .limit(6);

  let auditsQuery = supabase
    .from("audits")
    .select("id, title, scheduled_date, status, client_id")
    .eq("organization_id", ctx.organizationId)
    .or(`title.ilike.${ilikeTerm},description.ilike.${ilikeTerm}`)
    .order("scheduled_date", { ascending: false })
    .limit(6);

  const knowledgeDocumentsPromise = searchKnowledgeBase(query, {
    clientId: ctx.role === "client" ? ctx.clientId ?? null : null,
    limit: 8,
    scope: "all",
  });

  if (ctx.role === "client" && ctx.clientId) {
    clientsQuery = clientsQuery.eq("id", ctx.clientId);
    locationsQuery = locationsQuery.eq("client_id", ctx.clientId);
    personnelQuery = personnelQuery.eq("client_id", ctx.clientId);
    auditsQuery = auditsQuery.eq("client_id", ctx.clientId);
  }

  const [
    { data: clients },
    { data: locations },
    { data: personnel },
    { data: audits },
    knowledgeDocuments,
  ] = await Promise.all([
    clientsQuery,
    locationsQuery,
    personnelQuery,
    auditsQuery,
    knowledgeDocumentsPromise,
  ]);

  return {
    clients: (clients ?? []).map((client) => ({
      id: client.id,
      title: client.name,
      subtitle: client.email ?? "Cliente",
      href: `/clients/${client.id}`,
      meta: client.vat_number ?? undefined,
    })),
    locations: (locations ?? []).map((location) => ({
      id: location.id,
      title: location.name,
      subtitle: location.address ?? "Sede",
      href: location.client_id ? `/clients/${location.client_id}` : "/clients",
    })),
    personnel: (personnel ?? []).map((person) => ({
      id: person.id,
      title: `${person.first_name ?? ""} ${person.last_name ?? ""}`.trim() || "Collaboratore",
      subtitle: person.email ?? "Collaboratore",
      href: `/personnel/${person.id}`,
    })),
    audits: (audits ?? []).map((audit) => ({
      id: audit.id,
      title: audit.title,
      subtitle: audit.status ?? "Audit",
      href: `/audits/${audit.id}`,
      meta: audit.scheduled_date
        ? new Intl.DateTimeFormat("it-IT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }).format(new Date(audit.scheduled_date))
        : undefined,
    })),
    documents: knowledgeDocuments.map((document) => ({
      id: document.id,
      title: document.title,
      subtitle: document.snippet || "Documento rilevante nella knowledge base",
      href: document.href,
      meta: [
        document.category ?? null,
        document.sectionLabel ?? null,
        document.expiryDate
          ? `Scadenza ${new Intl.DateTimeFormat("it-IT", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }).format(new Date(document.expiryDate))}`
          : null,
      ]
        .filter(Boolean)
        .join(" · ") || undefined,
    })),
  };
}
