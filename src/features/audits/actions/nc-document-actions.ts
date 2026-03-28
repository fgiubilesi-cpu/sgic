"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import {
  searchKnowledgeBase,
  type KnowledgeSearchResult,
} from "@/features/knowledge/lib/knowledge-search";

type ActionResult<T = void> = { success: true; data?: T } | { success: false; error: string };

export async function linkDocumentToNC(
  nonConformityId: string,
  documentId: string,
  note?: string
): Promise<ActionResult<{ id: string }>> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { success: false, error: "Not authenticated." };
  if (ctx.role === "client") return { success: false, error: "Accesso negato." };

  const { supabase, organizationId } = ctx;

  const { data, error } = await supabase
    .from("nc_documents")
    .insert({
      non_conformity_id: nonConformityId,
      document_id: documentId,
      organization_id: organizationId,
      note: note ?? null,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath(`/audits/[id]`, "page");
  return { success: true, data: { id: data.id } };
}

export async function unlinkDocumentFromNC(
  nonConformityId: string,
  documentId: string
): Promise<ActionResult> {
  const ctx = await getOrganizationContext();
  if (!ctx) return { success: false, error: "Not authenticated." };
  if (ctx.role === "client") return { success: false, error: "Accesso negato." };

  const { supabase, organizationId } = ctx;

  const { error } = await supabase
    .from("nc_documents")
    .delete()
    .eq("non_conformity_id", nonConformityId)
    .eq("document_id", documentId)
    .eq("organization_id", organizationId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/audits/[id]`, "page");
  return { success: true };
}

export async function getNCDocuments(nonConformityId: string) {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { supabase, organizationId } = ctx;

  const { data } = await supabase
    .from("nc_documents")
    .select("id, note, document_id, documents(id, title, category, status, expiry_date, client_id)")
    .eq("non_conformity_id", nonConformityId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export type NCDocumentLink = Awaited<ReturnType<typeof getNCDocuments>>[number];

export async function searchDocumentsForNC(query: string) {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  return searchKnowledgeBase(query, {
    clientId: ctx.role === "client" ? ctx.clientId ?? null : null,
    limit: 10,
    scope: "all",
  });
}

export type DocumentSearchResult = KnowledgeSearchResult;
