type ClientsQueryResultLike = {
  error: unknown;
};

let hasLoggedMissingClientsDeletedAt = false;

export function isClientsDeletedAtMissingError(error: unknown) {
  const candidate = error as {
    code?: string | null;
    details?: string | null;
    hint?: string | null;
    message?: string | null;
  };

  const details = [candidate?.message, candidate?.details, candidate?.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return candidate?.code === "42703" && details.includes("clients.deleted_at");
}

export async function runClientsQueryWithSoftDeleteFallback<
  T extends ClientsQueryResultLike,
>(
  buildQuery: (useSoftDeleteGuard: boolean) => PromiseLike<T>
): Promise<T & { usedClientsSoftDeleteGuard: boolean }> {
  const guardedResult = await buildQuery(true);

  if (
    !guardedResult.error ||
    !isClientsDeletedAtMissingError(guardedResult.error)
  ) {
    return {
      ...guardedResult,
      usedClientsSoftDeleteGuard: true,
    };
  }

  if (!hasLoggedMissingClientsDeletedAt) {
    console.warn(
      "[clients-soft-delete] clients.deleted_at is missing in the active schema; retrying client reads without the soft-delete guard."
    );
    hasLoggedMissingClientsDeletedAt = true;
  }

  const fallbackResult = await buildQuery(false);

  return {
    ...fallbackResult,
    usedClientsSoftDeleteGuard: false,
  };
}
