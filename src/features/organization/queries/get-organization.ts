import { getOrganizationContext } from "@/lib/supabase/get-org-context";

export type Organization = {
  id: string;
  name: string | null;
  vat_number: string | null;
  slug: string | null;
};

export async function getOrganization(): Promise<Organization | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const { supabase, organizationId } = ctx;

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, vat_number, slug")
    .eq("id", organizationId)
    .single();

  if (orgError || !organization) {
    return null;
  }

  return {
    id: String(organization.id),
    name: organization.name ?? null,
    vat_number: organization.vat_number ?? null,
    slug: organization.slug ?? null,
  };
}
