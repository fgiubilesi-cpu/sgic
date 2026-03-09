import { createClient } from "@/lib/supabase/server";

export interface OrgContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  organizationId: string;
  role?: "inspector" | "client" | "admin";
  clientId?: string;
}

/**
 * Resolves the current user and their organization in a single call.
 * Returns null if the user is unauthenticated or has no organization.
 *
 * Use this at the top of every query and action that needs org-scoped data,
 * replacing the repeated 3-step pattern:
 *   1. supabase.auth.getUser()
 *   2. query profiles for organization_id
 *   3. filter data with organization_id
 */
export async function getOrganizationContext(): Promise<OrgContext | null> {
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
    .select("organization_id, id, role, client_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return null;
  }

  return {
    supabase,
    userId: user.id,
    organizationId: profile.organization_id,
    role: profile.role as "inspector" | "client" | "admin" | undefined,
    clientId: profile.client_id,
  };
}
