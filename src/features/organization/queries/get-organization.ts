import { createClient } from "@/lib/supabase/server";

export type Organization = {
  id: string;
  name: string | null;
  vat_number: string | null;
  slug: string | null;
};

export async function getOrganization(): Promise<Organization | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return null;
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, vat_number, slug")
    .eq("id", profile.organization_id)
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

