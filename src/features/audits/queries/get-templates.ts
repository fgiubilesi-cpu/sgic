import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export type AuditTemplate = {
  id: string;
  title: string;
};

/**
 * Fetches all checklist templates accessible to the current user.
 * Access is enforced by Supabase RLS; server-side only (uses next/headers).
 */
export async function getAuditTemplates(): Promise<AuditTemplate[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { supabase } = ctx;

  const { data, error } = await supabase
    .from("checklist_templates")
    .select("id, title")
    .order("title");

  if (error) {
    console.error("Error fetching audit templates:", error);
    return [];
  }

  return (data ?? []).map((t: any) => ({ id: String(t.id), title: t.title ?? "" }));
}

/**
 * Fetches checklist templates for a specific client.
 * Returns both global templates (client_id IS NULL) and client-specific templates.
 */
export async function getTemplatesForClient(clientId: string): Promise<AuditTemplate[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { supabase, organizationId } = ctx;

  const { data, error } = await supabase
    .from("checklist_templates")
    .select("id, title")
    .eq("organization_id", organizationId)
    .or(`client_id.is.null,client_id.eq.${clientId}`)
    .order("title");

  if (error) {
    console.error("Error fetching templates for client:", error);
    return [];
  }

  return (data ?? []).map((t: any) => ({ id: String(t.id), title: t.title ?? "" }));
}

export type TemplateWithDetails = {
  id: string;
  title: string;
  description: string | null;
  clientId: string | null;
  clientName: string | null;
  questionCount: number;
};

/**
 * Fetches all templates in the organization with metadata.
 * Includes question count and associated client name.
 */
export async function getAllTemplates(): Promise<TemplateWithDetails[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { supabase, organizationId } = ctx;

  const { data, error } = await supabase
    .from("checklist_templates")
    .select(`
      id,
      title,
      description,
      client_id,
      client:client_id(name),
      template_questions(id, deleted_at)
    `)
    .eq("organization_id", organizationId)
    .order("title");

  if (error) {
    console.error("Error fetching all templates:", error);
    return [];
  }

  return (data ?? []).map((t: any) => ({
    id: String(t.id),
    title: t.title ?? "",
    description: t.description ?? null,
    clientId: t.client_id ?? null,
    clientName: t.client?.[0]?.name ?? null,
    questionCount: (t.template_questions ?? []).filter((q: any) => !q.deleted_at).length,
  }));
}
