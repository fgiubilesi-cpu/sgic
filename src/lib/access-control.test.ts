import { describe, expect, it } from "vitest";

import {
  assertAdminOperator,
  assertInternalOperator,
  isInternalOperator,
} from "@/lib/access-control";
import type { OrgContext } from "@/lib/supabase/get-org-context";

function createContext(role: OrgContext["role"]): OrgContext {
  return {
    clientId: role === "client" ? "client-1" : undefined,
    organizationId: "org-1",
    role,
    supabase: {} as OrgContext["supabase"],
    userId: "user-1",
  };
}

describe("access-control", () => {
  it("recognizes admin and inspector as internal operators", () => {
    expect(isInternalOperator(createContext("admin"))).toBe(true);
    expect(isInternalOperator(createContext("inspector"))).toBe(true);
    expect(isInternalOperator(createContext("client"))).toBe(false);
  });

  it("rejects client users on internal-only surfaces", () => {
    expect(() => assertInternalOperator(createContext("client"), "workspace cliente")).toThrow(
      "Permesso negato"
    );
  });

  it("keeps admin-only checks strict", () => {
    expect(() => assertAdminOperator(createContext("inspector"), "console organizzazione")).toThrow(
      "Permesso negato"
    );
    expect(() => assertAdminOperator(createContext("admin"), "console organizzazione")).not.toThrow();
  });
});
