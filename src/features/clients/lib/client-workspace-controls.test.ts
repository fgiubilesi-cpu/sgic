import { describe, expect, it } from 'vitest';
import {
  buildContactForm,
  buildDeadlineForm,
  buildNoteForm,
  buildTaskForm,
  filterServiceLinesForScope,
  getServiceLineOptionLabel,
  getTaskStatusAction,
  normalizeSelectValue,
  type LocationOption,
  type ServiceLineOption,
} from '@/features/clients/lib/client-workspace-controls';
import type {
  ClientContactRecord,
  ClientManualDeadlineRecord,
  ClientNoteRecord,
  ClientTaskRecord,
} from '@/features/clients/queries/get-client-workspace';

const locations: LocationOption[] = [
  { id: 'loc-1', name: 'Sede Centrale' },
  { id: 'loc-2', name: 'Laboratorio' },
];

const serviceLines: ServiceLineOption[] = [
  { id: 'sl-1', location_id: null, title: 'Manuale HACCP' },
  { id: 'sl-2', location_id: 'loc-1', title: 'Audit interno' },
  { id: 'sl-3', location_id: 'loc-2', title: 'Campionamenti' },
];

const task: ClientTaskRecord = {
  audit_id: 'audit-1',
  client_id: 'client-1',
  completed_at: null,
  created_at: '2026-03-20T10:00:00.000Z',
  description: 'Verificare le ultime revisioni',
  due_date: '2026-03-30',
  id: 'task-1',
  is_recurring: true,
  location_id: 'loc-1',
  organization_id: 'org-1',
  owner_name: 'Mario Rossi',
  owner_profile_id: null,
  priority: 'high',
  recurrence_label: 'Ogni 30 giorni',
  service_line_id: 'sl-2',
  status: 'in_progress',
  title: 'Aggiornare manuale',
  updated_at: '2026-03-20T10:00:00.000Z',
};

const contact: ClientContactRecord = {
  client_id: 'client-1',
  created_at: '2026-03-20T10:00:00.000Z',
  department: 'Qualita',
  email: 'luca@example.com',
  full_name: 'Luca Bianchi',
  id: 'contact-1',
  is_active: true,
  is_primary: false,
  location_id: 'loc-1',
  notes: 'Referente operativo',
  organization_id: 'org-1',
  phone: '+39 000',
  role: 'Responsabile',
  updated_at: '2026-03-20T10:00:00.000Z',
};

const deadline: ClientManualDeadlineRecord = {
  client_id: 'client-1',
  created_at: '2026-03-20T10:00:00.000Z',
  created_by: null,
  description: 'Inviare documentazione',
  due_date: '2026-04-15',
  id: 'deadline-1',
  location_id: 'loc-2',
  organization_id: 'org-1',
  priority: 'critical',
  service_line_id: 'sl-3',
  source_id: null,
  source_type: 'manual',
  status: 'open',
  title: 'Rinnovo autorizzazione',
  updated_at: '2026-03-20T10:00:00.000Z',
};

const note: ClientNoteRecord = {
  author_name: 'Filippo',
  body: 'Tenere monitorato il fornitore esterno.',
  client_id: 'client-1',
  created_at: '2026-03-20T10:00:00.000Z',
  created_by: null,
  id: 'note-1',
  location_id: 'loc-2',
  note_type: 'warning',
  organization_id: 'org-1',
  pinned: true,
  title: 'Attenzione fornitore',
  updated_at: '2026-03-20T10:00:00.000Z',
};

describe('client-workspace-controls helpers', () => {
  it('normalizes select sentinel values', () => {
    expect(normalizeSelectValue('none')).toBe('');
    expect(normalizeSelectValue('loc-1')).toBe('loc-1');
  });

  it('builds form state from records and defaults', () => {
    expect(buildTaskForm(task)).toMatchObject({
      title: 'Aggiornare manuale',
      status: 'in_progress',
      priority: 'high',
      is_recurring: true,
    });
    expect(buildTaskForm()).toMatchObject({
      title: '',
      status: 'open',
      priority: 'medium',
      is_recurring: false,
    });

    expect(buildContactForm(contact)).toMatchObject({
      full_name: 'Luca Bianchi',
      is_active: true,
      is_primary: false,
    });
    expect(buildContactForm()).toMatchObject({
      full_name: '',
      is_active: true,
      is_primary: false,
    });

    expect(buildDeadlineForm(deadline)).toMatchObject({
      title: 'Rinnovo autorizzazione',
      priority: 'critical',
      status: 'open',
    });
    expect(buildDeadlineForm()).toMatchObject({
      title: '',
      priority: 'medium',
      status: 'open',
    });

    expect(buildNoteForm(note)).toMatchObject({
      title: 'Attenzione fornitore',
      note_type: 'warning',
      pinned: true,
    });
    expect(buildNoteForm()).toMatchObject({
      title: '',
      note_type: 'operational',
      pinned: false,
    });
  });

  it('returns the next task status action', () => {
    expect(getTaskStatusAction('open')).toEqual({
      label: 'Avvia',
      nextStatus: 'in_progress',
    });
    expect(getTaskStatusAction('in_progress')).toEqual({
      label: 'Chiudi',
      nextStatus: 'done',
    });
    expect(getTaskStatusAction('blocked')).toEqual({
      label: 'Sblocca',
      nextStatus: 'in_progress',
    });
    expect(getTaskStatusAction('done')).toEqual({
      label: 'Riapri',
      nextStatus: 'open',
    });
  });

  it('filters service lines by scope while keeping client-wide ones', () => {
    expect(filterServiceLinesForScope(serviceLines, null)).toHaveLength(3);
    expect(filterServiceLinesForScope(serviceLines, 'loc-1').map((item) => item.id)).toEqual([
      'sl-1',
      'sl-2',
    ]);
  });

  it('formats service line labels with location context when available', () => {
    expect(getServiceLineOptionLabel(serviceLines[0], locations)).toBe('Manuale HACCP');
    expect(getServiceLineOptionLabel(serviceLines[2], locations)).toBe(
      'Campionamenti · Laboratorio'
    );
  });
});
