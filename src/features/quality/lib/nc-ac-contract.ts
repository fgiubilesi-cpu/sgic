import type { ACStatus, NCSeverity, NCStatus } from "../schemas/nc-ac.schema";

type NullableString = string | null | undefined;

type SnakeCaseCorrectiveActionInput = {
  action_plan?: NullableString;
  completed_at?: NullableString;
  created_at?: NullableString;
  description?: NullableString;
  due_date?: NullableString;
  id: string;
  nc_id?: NullableString;
  non_conformity_id?: NullableString;
  responsible_person_email?: NullableString;
  responsible_person_name?: NullableString;
  root_cause?: NullableString;
  status?: string | null;
  target_completion_date?: NullableString;
  updated_at?: NullableString;
};

type CamelCaseCorrectiveActionInput = {
  actionPlan?: NullableString;
  completedAt?: NullableString;
  createdAt?: NullableString;
  description?: NullableString;
  dueDate?: NullableString;
  id: string;
  nonConformityId?: NullableString;
  responsiblePersonEmail?: NullableString;
  responsiblePersonName?: NullableString;
  rootCause?: NullableString;
  status?: string | null;
  targetCompletionDate?: NullableString;
  updatedAt?: NullableString;
};

type ChecklistItemShape = {
  outcome?: NullableString;
  question?: NullableString;
};

type SnakeCaseNonConformityInput = {
  audit?: {
    client?: { name?: NullableString } | null;
    client_id?: NullableString;
    location?: { name?: NullableString } | null;
    location_id?: NullableString;
  } | null;
  audit_id?: NullableString;
  checklist_item_id?: NullableString;
  checklist_items?: ChecklistItemShape | ChecklistItemShape[] | null;
  checklistItem?: ChecklistItemShape | null;
  closed_at?: NullableString;
  corrective_actions?: Array<SnakeCaseCorrectiveActionInput | CamelCaseCorrectiveActionInput> | null;
  created_at?: NullableString;
  description?: NullableString;
  id: string;
  identified_date?: NullableString;
  severity?: string | null;
  status?: string | null;
  title?: NullableString;
  updated_at?: NullableString;
};

type CamelCaseNonConformityInput = {
  auditId?: NullableString;
  checklistItem?: ChecklistItemShape | null;
  checklistItemId?: NullableString;
  closedAt?: NullableString;
  correctiveActions?: Array<SnakeCaseCorrectiveActionInput | CamelCaseCorrectiveActionInput> | null;
  createdAt?: NullableString;
  description?: NullableString;
  id: string;
  identifiedDate?: NullableString;
  severity?: string | null;
  status?: string | null;
  title?: NullableString;
  updatedAt?: NullableString;
};

export interface CanonicalCorrectiveAction {
  actionPlan: string | null;
  completedAt: string | null;
  createdAt: string | null;
  description: string | null;
  dueDate: string | null;
  id: string;
  nonConformityId: string | null;
  responsiblePersonEmail: string | null;
  responsiblePersonName: string | null;
  rootCause: string | null;
  status: ACStatus;
  targetCompletionDate: string | null;
  updatedAt: string | null;
}

export interface CanonicalNonConformity {
  auditId: string | null;
  checklistItemId: string | null;
  checklistOutcome: string | null;
  checklistQuestion: string | null;
  clientId: string | null;
  clientName: string | null;
  closedAt: string | null;
  correctiveActions: CanonicalCorrectiveAction[];
  createdAt: string | null;
  description: string | null;
  id: string;
  identifiedDate: string | null;
  locationId: string | null;
  locationName: string | null;
  severity: NCSeverity;
  status: NCStatus;
  title: string | null;
  updatedAt: string | null;
}

function normalizeNullableString(value: NullableString): string | null {
  return typeof value === "string" ? value : null;
}

export function normalizeNonConformityStatus(status: string | null | undefined): NCStatus {
  if (status === "pending_verification" || status === "closed") return status;
  return "open";
}

export function normalizeNonConformitySeverity(severity: string | null | undefined): NCSeverity {
  if (severity === "minor" || severity === "critical") return severity;
  return "major";
}

export function normalizeCorrectiveActionStatus(status: string | null | undefined): ACStatus {
  if (status === "completed" || status === "in_progress") return status;
  return "pending";
}

export function normalizeCorrectiveActionDateFields(input: {
  dueDate?: NullableString;
  due_date?: NullableString;
  targetCompletionDate?: NullableString;
  target_completion_date?: NullableString;
}): { due_date: string | null; target_completion_date: string | null } {
  const canonicalDate =
    normalizeNullableString(input.dueDate) ??
    normalizeNullableString(input.due_date) ??
    normalizeNullableString(input.targetCompletionDate) ??
    normalizeNullableString(input.target_completion_date) ??
    null;

  return {
    due_date: canonicalDate,
    target_completion_date: canonicalDate,
  };
}

export function toCanonicalCorrectiveAction(
  input: SnakeCaseCorrectiveActionInput | CamelCaseCorrectiveActionInput
): CanonicalCorrectiveAction {
  const camelInput = input as CamelCaseCorrectiveActionInput;
  const snakeInput = input as SnakeCaseCorrectiveActionInput;
  const dateFields = normalizeCorrectiveActionDateFields({
    dueDate: "dueDate" in input ? camelInput.dueDate : undefined,
    due_date: "due_date" in input ? snakeInput.due_date : undefined,
    targetCompletionDate: "targetCompletionDate" in input ? camelInput.targetCompletionDate : undefined,
    target_completion_date: "target_completion_date" in input ? snakeInput.target_completion_date : undefined,
  });

  return {
    actionPlan:
      "actionPlan" in input
        ? normalizeNullableString(camelInput.actionPlan)
        : normalizeNullableString(snakeInput.action_plan),
    completedAt:
      "completedAt" in input
        ? normalizeNullableString(camelInput.completedAt)
        : normalizeNullableString(snakeInput.completed_at),
    createdAt:
      "createdAt" in input
        ? normalizeNullableString(camelInput.createdAt)
        : normalizeNullableString(snakeInput.created_at),
    description: normalizeNullableString(input.description),
    dueDate: dateFields.due_date,
    id: input.id,
    nonConformityId:
      "nonConformityId" in input
        ? normalizeNullableString(camelInput.nonConformityId)
        : normalizeNullableString(snakeInput.non_conformity_id ?? snakeInput.nc_id),
    responsiblePersonEmail:
      "responsiblePersonEmail" in input
        ? normalizeNullableString(camelInput.responsiblePersonEmail)
        : normalizeNullableString(snakeInput.responsible_person_email),
    responsiblePersonName:
      "responsiblePersonName" in input
        ? normalizeNullableString(camelInput.responsiblePersonName)
        : normalizeNullableString(snakeInput.responsible_person_name),
    rootCause:
      "rootCause" in input
        ? normalizeNullableString(camelInput.rootCause)
        : normalizeNullableString(snakeInput.root_cause),
    status: normalizeCorrectiveActionStatus(input.status),
    targetCompletionDate: dateFields.target_completion_date,
    updatedAt:
      "updatedAt" in input
        ? normalizeNullableString(camelInput.updatedAt)
        : normalizeNullableString(snakeInput.updated_at),
  };
}

export function toCanonicalNonConformity(
  input: SnakeCaseNonConformityInput | CamelCaseNonConformityInput
): CanonicalNonConformity {
  const camelInput = input as CamelCaseNonConformityInput;
  const snakeInput = input as SnakeCaseNonConformityInput;
  const rawChecklist =
    "checklistItem" in input
      ? camelInput.checklistItem
      : Array.isArray(snakeInput.checklist_items)
        ? snakeInput.checklist_items[0]
        : snakeInput.checklist_items;

  const correctiveActions =
    "correctiveActions" in input
      ? camelInput.correctiveActions ?? []
      : snakeInput.corrective_actions ?? [];

  return {
    auditId:
      "auditId" in input
        ? normalizeNullableString(camelInput.auditId)
        : normalizeNullableString(snakeInput.audit_id),
    checklistItemId:
      "checklistItemId" in input
        ? normalizeNullableString(camelInput.checklistItemId)
        : normalizeNullableString(snakeInput.checklist_item_id),
    checklistOutcome: normalizeNullableString(rawChecklist?.outcome),
    checklistQuestion: normalizeNullableString(rawChecklist?.question),
    clientId:
      "audit" in input && input.audit
        ? normalizeNullableString(input.audit.client_id)
        : null,
    clientName:
      "audit" in input && input.audit?.client
        ? normalizeNullableString(input.audit.client.name)
        : null,
    closedAt:
      "closedAt" in input
        ? normalizeNullableString(camelInput.closedAt)
        : normalizeNullableString(snakeInput.closed_at),
    correctiveActions: correctiveActions.map(toCanonicalCorrectiveAction),
    createdAt:
      "createdAt" in input
        ? normalizeNullableString(camelInput.createdAt)
        : normalizeNullableString(snakeInput.created_at),
    description: normalizeNullableString(input.description),
    id: input.id,
    identifiedDate:
      "identifiedDate" in input
        ? normalizeNullableString(camelInput.identifiedDate)
        : normalizeNullableString(snakeInput.identified_date),
    locationId:
      "audit" in input && input.audit
        ? normalizeNullableString(input.audit.location_id)
        : null,
    locationName:
      "audit" in input && input.audit?.location
        ? normalizeNullableString(input.audit.location.name)
        : null,
    severity: normalizeNonConformitySeverity(input.severity),
    status: normalizeNonConformityStatus(input.status),
    title: normalizeNullableString(input.title),
    updatedAt:
      "updatedAt" in input
        ? normalizeNullableString(camelInput.updatedAt)
        : normalizeNullableString(snakeInput.updated_at),
  };
}

export function toProcessCorrectiveActionShape(
  input: SnakeCaseCorrectiveActionInput | CamelCaseCorrectiveActionInput | CanonicalCorrectiveAction
): { due_date: string | null; status: ACStatus; target_completion_date: string | null } {
  const canonical = "nonConformityId" in input || "non_conformity_id" in input || "nc_id" in input
    ? toCanonicalCorrectiveAction(input as SnakeCaseCorrectiveActionInput | CamelCaseCorrectiveActionInput)
    : input as CanonicalCorrectiveAction;

  return {
    due_date: canonical.dueDate,
    status: canonical.status,
    target_completion_date: canonical.targetCompletionDate,
  };
}
