import { getOrganizationContext } from "@/lib/supabase/get-org-context";

/**
 * Check if current user is an inspector or admin
 */
export async function isInspector(): Promise<boolean> {
  const ctx = await getOrganizationContext();
  return ctx?.role === "inspector" || ctx?.role === "admin";
}

/**
 * Check if current user is a client (read-only)
 */
export async function isClient(): Promise<boolean> {
  const ctx = await getOrganizationContext();
  return ctx?.role === "client";
}

/**
 * Get current user's role
 */
export async function getCurrentRole(): Promise<string | undefined> {
  const ctx = await getOrganizationContext();
  return ctx?.role;
}

/**
 * Check if current user can manage audits
 */
export async function canManageAudits(): Promise<boolean> {
  return await isInspector();
}

/**
 * Check if current user can view audit details (both client and inspector)
 */
export async function canViewAuditDetails(): Promise<boolean> {
  const ctx = await getOrganizationContext();
  return !!ctx;
}

/**
 * Check if current user can create/edit templates
 */
export async function canManageTemplates(): Promise<boolean> {
  return await isInspector();
}
