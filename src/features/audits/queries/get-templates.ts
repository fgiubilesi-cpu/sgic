import { createClient } from "@/lib/supabase/server";

export type AuditTemplate = {
  id: string;
  title: string;
};

/**
 * Fetches all checklist templates accessible to the current user.
 * Access is enforced by Supabase RLS; server-side only (uses next/headers).
 */
export async function getAuditTemplates(): Promise<AuditTemplate[]> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return [];

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
