"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";

type AllowedRole = "admin" | "inspector" | "client";

export async function updateOrganizationMemberAccess(input: {
  clientId?: string | null;
  profileId: string;
  role: AllowedRole;
}) {
  const ctx = await getOrganizationContext();
  if (!ctx) {
    return { error: "Sessione non valida. Effettua di nuovo l'accesso." };
  }

  if (ctx.role !== "admin") {
    return { error: "Solo un amministratore puo aggiornare accessi e ruoli." };
  }

  if (ctx.userId === input.profileId) {
    return { error: "Per sicurezza non puoi modificare il tuo stesso ruolo da questa schermata." };
  }

  const { supabase, organizationId } = ctx;

  const { data: targetProfile, error: targetError } = await supabase
    .from("profiles")
    .select("id, organization_id")
    .eq("id", input.profileId)
    .single();

  if (targetError || !targetProfile || targetProfile.organization_id !== organizationId) {
    return { error: "Utente non valido per questa organizzazione." };
  }

  if (input.role === "client" && !input.clientId) {
    return { error: "Gli utenti client devono essere associati a un cliente." };
  }

  const nextClientId = input.role === "client" ? input.clientId ?? null : null;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      client_id: nextClientId,
      role: input.role,
    })
    .eq("id", input.profileId)
    .eq("organization_id", organizationId);

  if (updateError) {
    return { error: "Aggiornamento non riuscito. Riprova." };
  }

  revalidatePath("/organization");
  revalidatePath("/settings");
  return { success: "Accesso aggiornato." };
}
