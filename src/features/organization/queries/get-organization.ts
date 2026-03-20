import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import type { OrganizationConsoleConfig } from "@/features/organization/lib/organization-console-config";
import {
  getDefaultOrganizationConsoleConfig,
  parseOrganizationConsoleConfig,
} from "@/features/organization/lib/organization-console-config";

export type Organization = {
  consoleStorageReady: boolean;
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

  if (!orgError && organization) {
    return {
      config: parseOrganizationConsoleConfig(organization.settings),
      consoleStorageReady: true,
      id: String(organization.id),
      logo_url: organization.logo_url ?? null,
      name: organization.name ?? null,
      vat_number: organization.vat_number ?? null,
      slug: organization.slug ?? null,
    };
  }

  const { data: fallbackOrganization, error: fallbackError } = await supabase
    .from("organizations")
    .select("id, name, vat_number, slug")
    .eq("id", organizationId)
    .single();

  if (fallbackError || !fallbackOrganization) {
    return null;
  }

  return {
    config: getDefaultOrganizationConsoleConfig(),
    consoleStorageReady: false,
    id: String(fallbackOrganization.id),
    logo_url: null,
    name: fallbackOrganization.name ?? null,
    vat_number: fallbackOrganization.vat_number ?? null,
    slug: fallbackOrganization.slug ?? null,
  };
}
