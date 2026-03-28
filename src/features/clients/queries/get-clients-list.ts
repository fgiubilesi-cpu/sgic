import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export interface ClientListItem {
  id: string;
  name: string;
}

export async function getClientsList(): Promise<ClientListItem[]> {
  const ctx = await getOrganizationContext();
  if (!ctx) return [];

  const { supabase, organizationId } = ctx;

  const { data, error } = await supabase
    .from("clients")
    .select("id, name")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .order("name");

  if (error || !data) return [];

  return data.map((c) => ({
    id: String(c.id),
    name: c.name ?? "Senza nome",
  }));
}
