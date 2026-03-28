import { describe, expect, it, vi } from "vitest";

import {
  isClientsDeletedAtMissingError,
  runClientsQueryWithSoftDeleteFallback,
} from "@/lib/supabase/clients-soft-delete";

describe("isClientsDeletedAtMissingError", () => {
  it("matches the Postgres missing-column error for clients.deleted_at", () => {
    expect(
      isClientsDeletedAtMissingError({
        code: "42703",
        message: "column clients.deleted_at does not exist",
      })
    ).toBe(true);
  });

  it("ignores other missing-column errors", () => {
    expect(
      isClientsDeletedAtMissingError({
        code: "42703",
        message: "column organizations.settings does not exist",
      })
    ).toBe(false);
  });
});

describe("runClientsQueryWithSoftDeleteFallback", () => {
  it("keeps the guarded query result when the schema is aligned", async () => {
    const builder = vi
      .fn()
      .mockResolvedValue({ data: ["ok"], error: null });

    const result = await runClientsQueryWithSoftDeleteFallback<{
      data: string[];
      error: null;
    }>(builder);

    expect(builder).toHaveBeenCalledTimes(1);
    expect(builder).toHaveBeenCalledWith(true);
    expect(result.data).toEqual(["ok"]);
    expect(result.usedClientsSoftDeleteGuard).toBe(true);
  });

  it("retries without deleted_at when the active schema still misses the column", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const builder = vi
      .fn()
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "42703",
          message: "column clients.deleted_at does not exist",
        },
      })
      .mockResolvedValueOnce({ data: ["fallback"], error: null });

    const result = await runClientsQueryWithSoftDeleteFallback<{
      data: string[] | null;
      error: { code: string; message: string } | null;
    }>(builder);

    expect(builder).toHaveBeenCalledTimes(2);
    expect(builder).toHaveBeenNthCalledWith(1, true);
    expect(builder).toHaveBeenNthCalledWith(2, false);
    expect(result.data).toEqual(["fallback"]);
    expect(result.usedClientsSoftDeleteGuard).toBe(false);
    warnSpy.mockRestore();
  });
});
