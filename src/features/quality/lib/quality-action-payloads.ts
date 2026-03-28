import type {
  CorrectiveAction,
  NonConformity,
} from "@/features/quality/schemas/nc-ac.schema";
import { normalizeCorrectiveActionDateFields } from "@/features/quality/lib/nc-ac-contract";

export function buildNonConformityInsertPayload(
  validated: NonConformity,
  organizationId: string
) {
  return {
    description: validated.description,
    identified_date: validated.identified_date,
    organization_id: organizationId,
    severity: validated.severity,
    status: validated.status,
    title: validated.title,
  };
}

export function buildNonConformityUpdatePayload(
  formData: Partial<NonConformity>,
  now: string
) {
  const nextStatus = formData.status;

  return {
    ...formData,
    closed_at: nextStatus === "closed" ? now : nextStatus ? null : undefined,
    updated_at: now,
  };
}

export function buildCorrectiveActionInsertPayload(
  validated: CorrectiveAction,
  organizationId: string
) {
  const dateFields = normalizeCorrectiveActionDateFields({
    due_date: validated.due_date,
  });

  return {
    description: validated.description,
    non_conformity_id: validated.non_conformity_id,
    organization_id: organizationId,
    ...dateFields,
    status: validated.status,
  };
}

export function buildCorrectiveActionUpdatePayload(
  formData: Partial<CorrectiveAction>,
  now: string
) {
  const dueDatePatch = Object.prototype.hasOwnProperty.call(formData, "due_date")
    ? normalizeCorrectiveActionDateFields({
        due_date: formData.due_date,
      })
    : {};

  return {
    ...formData,
    ...dueDatePatch,
    updated_at: now,
  };
}
