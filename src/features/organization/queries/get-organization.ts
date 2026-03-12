import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import {
  parseOrganizationConsoleConfig,
  type OrganizationConsoleConfig,
} from "@/features/organization/lib/organization-console-config";

export type Organization = {
  config: OrganizationConsoleConfig;
  id: string;
  logo_url: string | null;
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
    .select("id, name, vat_number, slug, logo_url, settings")
    .eq("id", organizationId)
    .single();

  if (orgError || !organization) {
    return null;
  }

  return {
    config: parseOrganizationConsoleConfig(organization.settings),
    id: String(organization.id),
    logo_url: organization.logo_url ?? null,
    name: organization.name ?? null,
    vat_number: organization.vat_number ?? null,
    slug: organization.slug ?? null,
  };
}
