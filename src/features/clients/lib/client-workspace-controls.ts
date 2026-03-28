import type {
  ClientContactRecord,
  ClientManualDeadlineRecord,
  ClientNoteRecord,
  ClientTaskPriority,
  ClientTaskRecord,
  ClientTaskStatus,
} from '@/features/clients/queries/get-client-workspace';

export interface LocationOption {
  id: string;
  name: string;
}

export interface ServiceLineOption {
  id: string;
  location_id: string | null;
  title: string;
}

export function normalizeSelectValue(value: string) {
  return value === 'none' ? '' : value;
}

export function buildTaskForm(task?: ClientTaskRecord) {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? ('open' as ClientTaskStatus),
    priority: task?.priority ?? ('medium' as ClientTaskPriority),
    due_date: task?.due_date ?? '',
    owner_name: task?.owner_name ?? '',
    location_id: task?.location_id ?? '',
    audit_id: task?.audit_id ?? '',
    service_line_id: task?.service_line_id ?? '',
    is_recurring: task?.is_recurring ?? false,
    recurrence_label: task?.recurrence_label ?? '',
  };
}

export function buildContactForm(contact?: ClientContactRecord) {
  return {
    full_name: contact?.full_name ?? '',
    role: contact?.role ?? '',
    department: contact?.department ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    location_id: contact?.location_id ?? '',
    is_primary: contact?.is_primary ?? false,
    is_active: contact?.is_active ?? true,
    notes: contact?.notes ?? '',
  };
}

export function buildDeadlineForm(deadline?: ClientManualDeadlineRecord) {
  return {
    title: deadline?.title ?? '',
    description: deadline?.description ?? '',
    due_date: deadline?.due_date ?? '',
    priority: deadline?.priority ?? ('medium' as ClientTaskPriority),
    status: deadline?.status ?? ('open' as ClientManualDeadlineRecord['status']),
    location_id: deadline?.location_id ?? '',
    service_line_id: deadline?.service_line_id ?? '',
  };
}

export function buildNoteForm(note?: ClientNoteRecord) {
  return {
    title: note?.title ?? '',
    body: note?.body ?? '',
    note_type: note?.note_type ?? ('operational' as ClientNoteRecord['note_type']),
    pinned: note?.pinned ?? false,
    location_id: note?.location_id ?? '',
  };
}

export function getTaskStatusAction(status: ClientTaskStatus) {
  if (status === 'open') return { label: 'Avvia', nextStatus: 'in_progress' as const };
  if (status === 'in_progress') return { label: 'Chiudi', nextStatus: 'done' as const };
  if (status === 'blocked') return { label: 'Sblocca', nextStatus: 'in_progress' as const };
  return { label: 'Riapri', nextStatus: 'open' as const };
}

export function filterServiceLinesForScope(
  serviceLines: ServiceLineOption[],
  locationId: string | null
) {
  if (!locationId) return serviceLines;

  return serviceLines.filter(
    (serviceLine) => !serviceLine.location_id || serviceLine.location_id === locationId
  );
}

export function getServiceLineOptionLabel(
  serviceLine: ServiceLineOption,
  locations: LocationOption[]
) {
  const locationName = serviceLine.location_id
    ? locations.find((location) => location.id === serviceLine.location_id)?.name ?? null
    : null;

  return locationName ? `${serviceLine.title} · ${locationName}` : serviceLine.title;
}
