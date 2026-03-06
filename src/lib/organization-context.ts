import { createClient } from "@/lib/supabase/server";

export async function getOrganizationContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  return {
    organizationId: user.app_metadata?.organization_id || user.user_metadata?.organization_id,
    isAdmin: user.app_metadata?.role === 'admin',
  };
}