import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import type { TemplateWithDetails } from "@/features/audits/types/templates";

type AuditTemplateRow = {
  id: string;
  title: string | null;
};

type TemplateQuestionRow = {
  deleted_at: string | null;
};

type TemplateClientRow = {
  name: string | null;
};

type TemplateDetailsRow = AuditTemplateRow & {
  client: TemplateClientRow | TemplateClientRow[] | null;
  client_id: string | null;
  description: string | null;
  template_questions: TemplateQuestionRow[] | null;
};

export type AuditTemplate = {
  id: string;
  title: string;
};

// Re-export for backwards compatibility
export type { TemplateWithDetails };

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

  return (data ?? []).map((template: AuditTemplateRow) => ({
    id: String(template.id),
    title: template.title ?? "",
  }));
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

  return (data ?? []).map((template: AuditTemplateRow) => ({
    id: String(template.id),
    title: template.title ?? "",
  }));
}

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

  return (data ?? []).map((template: TemplateDetailsRow) => {
    const clientRecord = Array.isArray(template.client)
      ? template.client[0]
      : template.client;

    return {
      id: String(template.id),
      title: template.title ?? "",
      description: template.description ?? null,
      clientId: template.client_id ?? null,
      clientName: clientRecord?.name ?? null,
      questionCount: (template.template_questions ?? []).filter((question) => !question.deleted_at).length,
    };
  });
}
