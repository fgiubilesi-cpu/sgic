"use server";

import { revalidatePath } from "next/cache";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import {
  parseOrganizationConsoleConfig,
  serializeOrganizationConsoleConfig,
} from "@/features/organization/lib/organization-console-config";
import {
  organizationBrandingSchema,
  organizationNotificationsSchema,
  organizationProfileDetailsSchema,
  organizationRulesSchema,
  type OrganizationBrandingInput,
  type OrganizationNotificationsInput,
  type OrganizationProfileDetailsInput,
  type OrganizationRulesInput,
} from "@/features/organization/schemas/organization-console-schema";

type ConsoleActionResult = {
  error?: string;
  success?: string;
};

async function getAdminOrganizationRow() {
  const ctx = await getOrganizationContext();
  if (!ctx) return { error: "Sessione non valida.", row: null as any };
  if (ctx.role !== "admin") return { error: "Solo gli admin possono modificare questa console.", row: null as any };

  const { data: organization, error } = await ctx.supabase
    .from("organizations")
    .select("id, logo_url, settings")
    .eq("id", ctx.organizationId)
    .single();

  if (error || !organization) return { error: "Organizzazione non trovata.", row: null as any };
  return { ctx, error: null as string | null, row: organization };
}

function revalidateOrganizationConsole() {
  revalidatePath("/organization");
  revalidatePath("/dashboard");
  revalidatePath("/audits");
}

export async function updateOrganizationProfileDetails(
  values: OrganizationProfileDetailsInput
): Promise<ConsoleActionResult> {
  const parsed = organizationProfileDetailsSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati profilo non validi." };

  const { ctx, error, row } = await getAdminOrganizationRow();
  if (error || !ctx) return { error: error ?? "Errore autorizzazione." };

  const config = parseOrganizationConsoleConfig(row.settings);
  config.profile = parsed.data;

  const { error: updateError } = await ctx.supabase
    .from("organizations")
    .update({ settings: serializeOrganizationConsoleConfig(config) })
    .eq("id", ctx.organizationId);

  if (updateError) return { error: "Salvataggio profilo non riuscito." };

  revalidateOrganizationConsole();
  return { success: "Profilo organizzazione aggiornato." };
}

export async function updateOrganizationRules(
  values: OrganizationRulesInput
): Promise<ConsoleActionResult> {
  const parsed = organizationRulesSchema.safeParse(values);
  if (!parsed.success) return { error: "Regole operative non valide." };

  const { ctx, error, row } = await getAdminOrganizationRow();
  if (error || !ctx) return { error: error ?? "Errore autorizzazione." };

  const config = parseOrganizationConsoleConfig(row.settings);
  config.rules = parsed.data;

  const { error: updateError } = await ctx.supabase
    .from("organizations")
    .update({ settings: serializeOrganizationConsoleConfig(config) })
    .eq("id", ctx.organizationId);

  if (updateError) return { error: "Salvataggio regole non riuscito." };

  revalidateOrganizationConsole();
  return { success: "Regole operative aggiornate." };
}

export async function updateOrganizationBranding(
  values: OrganizationBrandingInput
): Promise<ConsoleActionResult> {
  const parsed = organizationBrandingSchema.safeParse(values);
  if (!parsed.success) return { error: "Branding non valido." };

  const { ctx, error, row } = await getAdminOrganizationRow();
  if (error || !ctx) return { error: error ?? "Errore autorizzazione." };

  const config = parseOrganizationConsoleConfig(row.settings);
  config.branding = {
    emailSignature: parsed.data.emailSignature ?? "",
    primaryColor: parsed.data.primaryColor,
    reportSubtitle: parsed.data.reportSubtitle ?? "",
    reportTitle: parsed.data.reportTitle,
  };

  const { error: updateError } = await ctx.supabase
    .from("organizations")
    .update({
      logo_url: parsed.data.logoUrl || null,
      settings: serializeOrganizationConsoleConfig(config),
    })
    .eq("id", ctx.organizationId);

  if (updateError) return { error: "Salvataggio branding non riuscito." };

  revalidateOrganizationConsole();
  return { success: "Branding tenant aggiornato." };
}

export async function updateOrganizationNotifications(
  values: OrganizationNotificationsInput
): Promise<ConsoleActionResult> {
  const parsed = organizationNotificationsSchema.safeParse(values);
  if (!parsed.success) return { error: "Configurazione notifiche non valida." };

  const { ctx, error, row } = await getAdminOrganizationRow();
  if (error || !ctx) return { error: error ?? "Errore autorizzazione." };

  const config = parseOrganizationConsoleConfig(row.settings);
  config.notifications = parsed.data;

  const { error: updateError } = await ctx.supabase
    .from("organizations")
    .update({ settings: serializeOrganizationConsoleConfig(config) })
    .eq("id", ctx.organizationId);

  if (updateError) return { error: "Salvataggio notifiche non riuscito." };

  revalidateOrganizationConsole();
  return { success: "Preferenze notifiche aggiornate." };
}
