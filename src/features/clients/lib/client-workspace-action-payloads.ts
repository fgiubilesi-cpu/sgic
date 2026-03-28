import type {
  ClientDeadlineInput,
  ClientTaskInput,
} from "@/features/clients/schemas/client-workspace-schema";
import type { ClientTaskStatus } from "@/features/clients/queries/get-client-workspace";

function normalizeOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalDate(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function buildClientTaskMutationPayload(input: {
  auditId: string | null;
  clientId: string;
  locationId: string | null;
  organizationId: string;
  serviceLineId: string | null;
  validated: ClientTaskInput;
  now: string;
}) {
  const shouldComplete = input.validated.status === "done";

  return {
    audit_id: input.auditId,
    client_id: input.clientId,
    completed_at: shouldComplete ? input.now : null,
    description: normalizeOptionalString(input.validated.description),
    due_date: normalizeOptionalDate(input.validated.due_date),
    is_recurring: input.validated.is_recurring,
    location_id: input.locationId,
    organization_id: input.organizationId,
    owner_name: normalizeOptionalString(input.validated.owner_name),
    priority: input.validated.priority,
    recurrence_label: normalizeOptionalString(input.validated.recurrence_label),
    service_line_id: input.serviceLineId,
    status: input.validated.status,
    title: input.validated.title,
  };
}

export function buildClientTaskStatusPatch(
  status: ClientTaskStatus,
  now: string
) {
  return {
    completed_at: status === "done" ? now : null,
    status,
  };
}

export function buildClientDeadlineMutationPayload(input: {
  clientId: string;
  createdBy?: string;
  locationId: string | null;
  organizationId: string;
  serviceLineId: string | null;
  validated: ClientDeadlineInput;
}) {
  return {
    client_id: input.clientId,
    created_by: input.createdBy ?? undefined,
    description: normalizeOptionalString(input.validated.description),
    due_date: input.validated.due_date,
    location_id: input.locationId,
    organization_id: input.organizationId,
    priority: input.validated.priority,
    service_line_id: input.serviceLineId,
    source_type: "manual",
    status: input.validated.status,
    title: input.validated.title,
  };
}
