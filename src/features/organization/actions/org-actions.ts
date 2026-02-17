"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  organizationUpdateSchema,
  type OrganizationUpdateInput,
} from "@/features/organization/schemas/organization-schema";

export type UpdateOrganizationResult = {
  success?: string;
  error?: string;
};

export async function updateOrganization(
  values: OrganizationUpdateInput
): Promise<UpdateOrganizationResult> {
  const parsed = organizationUpdateSchema.safeParse(values);

  if (!parsed.success) {
    return {
      error: "Dati non validi. Controlla i campi del form.",
    };
  }

  const { name, vat_number, slug } = parsed.data;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Non sei autenticato. Effettua nuovamente l'accesso.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return {
      error:
        "Profilo non collegato ad alcuna organizzazione. Contatta l'amministratore.",
    };
  }

  const { error: updateError } = await supabase
    .from("organizations")
    .update({
      name,
      vat_number: vat_number && vat_number.length > 0 ? vat_number : null,
      slug,
    })
    .eq("id", profile.organization_id);

  if (updateError) {
    // Gestione mirata per slug duplicato (vincolo di univocità lato DB)
    if (updateError.code === "23505") {
      return {
        error:
          "Lo slug scelto è già in uso da un'altra organizzazione. Scegli uno slug diverso.",
      };
    }

    return {
      error:
        "Impossibile aggiornare l'organizzazione in questo momento. Riprova più tardi.",
    };
  }

  // Invalida la cache della pagina di organizzazione
  revalidatePath("/organization");

  return {
    success: "Organizzazione aggiornata con successo.",
  };
}

