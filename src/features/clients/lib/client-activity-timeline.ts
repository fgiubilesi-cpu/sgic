import type { AuditTimelineEvent } from '@/features/audits/queries/get-audit-timeline';
import type { DocumentListItem } from '@/features/documents/queries/get-documents';
import type {
  ClientDeadlineRecord,
  ClientNoteRecord,
  ClientTaskRecord,
} from '@/features/clients/queries/get-client-workspace';

export type ClientActivityTimelineKind = 'audit' | 'deadline' | 'document' | 'note' | 'task';

export interface ClientActivityTimelineItem {
  date: string | null;
  description: string | null;
  href: string | null;
  id: string;
  kind: ClientActivityTimelineKind;
  locationName: string | null;
  title: string;
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function truncate(value: string | null | undefined, maxLength = 140) {
  const normalized = (value ?? '').trim();
  if (normalized.length <= maxLength) return normalized || null;
  return `${normalized.slice(0, maxLength - 1)}...`;
}

function taskStatusLabel(status: ClientTaskRecord['status']) {
  if (status === 'done') return 'completata';
  if (status === 'blocked') return 'bloccata';
  if (status === 'in_progress') return 'in lavorazione';
  return 'aperta';
}

function deadlineSourceLabel(sourceType: ClientDeadlineRecord['source_type']) {
  if (sourceType === 'manual') return 'manuale';
  if (sourceType === 'document') return 'documento';
  if (sourceType === 'contract') return 'contratto';
  if (sourceType === 'audit') return 'audit';
  return 'task';
}

export function buildClientActivityTimeline({
  deadlines,
  documents,
  locationMap,
  notes,
  tasks,
  timelineEvents,
}: {
  deadlines: ClientDeadlineRecord[];
  documents: DocumentListItem[];
  locationMap: Map<string, string>;
  notes: ClientNoteRecord[];
  tasks: ClientTaskRecord[];
  timelineEvents: AuditTimelineEvent[];
}): ClientActivityTimelineItem[] {
  const auditItems: ClientActivityTimelineItem[] = timelineEvents.map((event) => ({
    date: event.scheduled_date ?? event.completed_date ?? null,
    description: [
      event.status,
      event.score !== null ? `Score ${event.score}%` : null,
      event.nc_count > 0 ? `${event.nc_count} NC` : null,
    ]
      .filter(Boolean)
      .join(' · ') || null,
    href: event.audit_id ? `/audits/${event.audit_id}` : null,
    id: `audit-${event.id}`,
    kind: 'audit',
    locationName: event.location_name,
    title: event.audit_title ? `Audit: ${event.audit_title}` : 'Audit cliente',
  }));

  const taskItems: ClientActivityTimelineItem[] = tasks.map((task) => ({
    date: task.completed_at ?? task.updated_at ?? task.created_at,
    description: [
      `Task ${taskStatusLabel(task.status)}`,
      task.owner_name ? `Owner ${task.owner_name}` : 'Owner da definire',
      task.due_date ? `Scadenza ${new Date(task.due_date).toLocaleDateString('it-IT')}` : null,
      task.is_recurring && task.recurrence_label ? task.recurrence_label : null,
    ]
      .filter(Boolean)
      .join(' · '),
    href: null,
    id: `task-${task.id}`,
    kind: 'task',
    locationName: task.location_id ? locationMap.get(task.location_id) ?? 'Sede rimossa' : null,
    title: task.title,
  }));

  const deadlineItems: ClientActivityTimelineItem[] = deadlines.map((deadline) => ({
    date: deadline.updated_at ?? deadline.created_at,
    description: [
      `Scadenza ${deadlineSourceLabel(deadline.source_type)}`,
      `Termine ${new Date(deadline.due_date).toLocaleDateString('it-IT')}`,
      deadline.status !== 'open' ? `Stato ${deadline.status}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    href: null,
    id: `deadline-${deadline.id}`,
    kind: 'deadline',
    locationName: deadline.location_id
      ? locationMap.get(deadline.location_id) ?? 'Sede rimossa'
      : null,
    title: deadline.title,
  }));

  const noteItems: ClientActivityTimelineItem[] = notes.map((note) => ({
    date: note.updated_at ?? note.created_at,
    description: [
      note.note_type,
      note.pinned ? 'in evidenza' : null,
      truncate(note.body),
    ]
      .filter(Boolean)
      .join(' · '),
    href: null,
    id: `note-${note.id}`,
    kind: 'note',
    locationName: note.location_id ? locationMap.get(note.location_id) ?? 'Sede rimossa' : null,
    title: note.title,
  }));

  const documentItems: ClientActivityTimelineItem[] = documents.map((document) => ({
    date: document.last_reviewed_at ?? document.updated_at ?? document.created_at,
    description: [
      document.category ?? 'Documento',
      document.last_review_action ? `Review ${document.last_review_action}` : null,
      document.ingestion_status ? `Intake ${document.ingestion_status}` : null,
      document.version_count > 1 ? `${document.version_count} versioni` : null,
    ]
      .filter(Boolean)
      .join(' · '),
    href: document.access_url ?? null,
    id: `document-${document.id}`,
    kind: 'document',
    locationName: document.location_id
      ? locationMap.get(document.location_id) ?? document.location_name ?? 'Sede rimossa'
      : document.location_name ?? null,
    title: document.title ?? document.file_name ?? 'Documento senza titolo',
  }));

  return [...auditItems, ...taskItems, ...deadlineItems, ...noteItems, ...documentItems]
    .filter((item) => parseDate(item.date))
    .sort((left, right) => {
      return (parseDate(right.date)?.getTime() ?? 0) - (parseDate(left.date)?.getTime() ?? 0);
    });
}
