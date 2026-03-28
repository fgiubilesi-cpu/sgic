import type { OrgContext } from "@/lib/supabase/get-org-context";

export type InternalOrgContext = OrgContext & {
  role: "admin" | "inspector";
};

export function isInternalOperator(
  ctx: OrgContext | null
): ctx is InternalOrgContext {
  return Boolean(ctx && (ctx.role === "admin" || ctx.role === "inspector"));
}

export function assertInternalOperator(
  ctx: OrgContext | null,
  scope = "questa operazione"
): asserts ctx is InternalOrgContext {
  if (!ctx) {
    throw new Error("Unauthorized");
  }

  if (!isInternalOperator(ctx)) {
    throw new Error(`Permesso negato per ${scope}`);
  }
}

export function assertAdminOperator(
  ctx: OrgContext | null,
  scope = "questa operazione"
): asserts ctx is OrgContext & { role: "admin" } {
  if (!ctx) {
    throw new Error("Unauthorized");
  }

  if (ctx.role !== "admin") {
    throw new Error(`Permesso negato per ${scope}`);
  }
}
