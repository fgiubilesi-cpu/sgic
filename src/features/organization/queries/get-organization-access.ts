import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { runClientsQueryWithSoftDeleteFallback } from "@/lib/supabase/clients-soft-delete";

export type OrganizationAccessMember = {
  clientId: string | null;
  clientName: string | null;
  email: string | null;
  fullName: string | null;
  id: string;
  role: string | null;
};

export type OrganizationAccessOverview = {
  canManageAccess: boolean;
  clients: Array<{ id: string; name: string }>;
  currentUserId: string;
  members: OrganizationAccessMember[];
  roleSummary: Array<{ label: string; value: number }>;
};

export async function getOrganizationAccessOverview(): Promise<OrganizationAccessOverview | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const { supabase, organizationId, role, userId } = ctx;

  const [{ data: profiles, error: profilesError }, { data: clients, error: clientsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, role, client_id")
        .eq("organization_id", organizationId)
        .order("full_name", { ascending: true }),
      runClientsQueryWithSoftDeleteFallback((useSoftDeleteGuard) => {
        let query = supabase
          .from("clients")
          .select("id, name")
          .eq("organization_id", organizationId);

        if (useSoftDeleteGuard) {
          query = query.is("deleted_at", null);
        }

        return query.order("name");
      }),
    ]);

  if (profilesError || clientsError) {
    return null;
  }

  const clientMap = new Map((clients ?? []).map((client) => [client.id, client.name]));
  const members = (profiles ?? []).map((profile) => ({
    clientId: profile.client_id,
    clientName: profile.client_id ? clientMap.get(profile.client_id) ?? null : null,
    email: profile.email,
    fullName: profile.full_name,
    id: profile.id,
    role: profile.role,
  }));

  const roleSummary = [
    {
      label: "Admin",
      value: members.filter((member) => member.role === "admin").length,
    },
    {
      label: "Inspector",
      value: members.filter((member) => member.role === "inspector").length,
    },
    {
      label: "Client",
      value: members.filter((member) => member.role === "client").length,
    },
  ];

  return {
    canManageAccess: role === "admin",
    clients: (clients ?? []).map((client) => ({ id: client.id, name: client.name })),
    currentUserId: userId,
    members,
    roleSummary,
  };
}
