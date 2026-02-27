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
    return { error: "Invalid data. Please check the form fields." };
  }

  const { name, vat_number, slug } = parsed.data;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Not authenticated. Please sign in again." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    return {
      error: "Profile not linked to any organisation. Contact your administrator.",
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
    if (updateError.code === "23505") {
      return {
        error: "This slug is already in use by another organisation. Please choose a different one.",
      };
    }
    return { error: "Unable to update organisation. Please try again later." };
  }

  revalidatePath("/organization");
  return { success: "Organisation updated successfully." };
}
