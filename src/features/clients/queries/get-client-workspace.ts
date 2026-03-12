import { createClient } from '@/lib/supabase/server';

export type ClientTaskStatus = 'open' | 'in_progress' | 'blocked' | 'done';
export type ClientTaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type ClientContractStatus = 'draft' | 'active' | 'paused' | 'expired';
export type ClientDeadlineStatus = 'open' | 'completed' | 'cancelled';
export type ClientNoteType = 'operational' | 'warning' | 'decision' | 'info';

export interface ClientContractRecord {
  activity_frequency: string | null;
  attachment_url: string | null;
  client_id: string;
  contract_type: string;
  created_at: string;
  end_date: string | null;
  id: string;
  internal_owner: string | null;
  notes: string | null;
  organization_id: string;
  renewal_date: string | null;
  service_scope: string | null;
  start_date: string | null;
  status: ClientContractStatus;
  updated_at: string;
}

export interface ClientTaskRecord {
  audit_id: string | null;
  client_id: string;
  completed_at: string | null;
  created_at: string;
  description: string | null;
  due_date: string | null;
  id: string;
  is_recurring: boolean;
  location_id: string | null;
  organization_id: string;
  owner_name: string | null;
  owner_profile_id: string | null;
  priority: ClientTaskPriority;
  recurrence_label: string | null;
  status: ClientTaskStatus;
  title: string;
  updated_at: string;
}

export interface ClientContactRecord {
  client_id: string;
  created_at: string;
  department: string | null;
  email: string | null;
  full_name: string;
  id: string;
  is_active: boolean;
  is_primary: boolean;
  location_id: string | null;
  notes: string | null;
  organization_id: string;
  phone: string | null;
  role: string | null;
  updated_at: string;
}

export interface ClientManualDeadlineRecord {
  client_id: string;
  created_at: string;
  created_by: string | null;
  description: string | null;
  due_date: string;
  id: string;
  location_id: string | null;
  organization_id: string;
  priority: ClientTaskPriority;
  source_id: string | null;
  source_type: 'manual' | 'contract' | 'task' | 'document' | 'audit';
  status: ClientDeadlineStatus;
  title: string;
  updated_at: string;
}

export interface ClientNoteRecord {
  body: string;
  client_id: string;
  created_at: string;
  created_by: string | null;
  id: string;
  location_id: string | null;
  note_type: ClientNoteType;
  organization_id: string;
  pinned: boolean;
  title: string;
  updated_at: string;
  author_name: string | null;
}

export interface ClientWorkspaceData {
  contacts: ClientContactRecord[];
  contract: ClientContractRecord | null;
  manualDeadlines: ClientManualDeadlineRecord[];
  notes: ClientNoteRecord[];
  tasks: ClientTaskRecord[];
  missingTables: string[];
}

function isTableMissingError(error: unknown) {
  const candidate = error as { code?: string };
  return candidate?.code === '42P01' || candidate?.code === '42703';
}

export async function getClientWorkspaceData(
  organizationId: string,
  clientId: string
): Promise<ClientWorkspaceData> {
  const supabase = await createClient();
  const missingTables = new Set<string>();

  const [contractResult, tasksResult, contactsResult, manualDeadlinesResult, notesResult] =
    await Promise.all([
      supabase
        .from('client_contracts')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('client_id', clientId)
        .maybeSingle(),
      supabase
        .from('client_tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('client_id', clientId)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false }),
      supabase
        .from('client_contacts')
        .select(
          'id, organization_id, client_id, full_name, email, phone, role, notes, is_primary, location_id, department, is_active, created_at, updated_at'
        )
        .eq('organization_id', organizationId)
        .eq('client_id', clientId)
        .order('is_primary', { ascending: false })
        .order('full_name', { ascending: true }),
      supabase
        .from('client_deadlines')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('client_id', clientId)
        .eq('source_type', 'manual')
        .order('due_date', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase
        .from('client_notes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('client_id', clientId)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false }),
    ]);

  if (contractResult.error && !isTableMissingError(contractResult.error)) throw contractResult.error;
  if (tasksResult.error && !isTableMissingError(tasksResult.error)) throw tasksResult.error;
  if (contactsResult.error && !isTableMissingError(contactsResult.error)) throw contactsResult.error;
  if (manualDeadlinesResult.error && !isTableMissingError(manualDeadlinesResult.error)) {
    throw manualDeadlinesResult.error;
  }
  if (notesResult.error && !isTableMissingError(notesResult.error)) throw notesResult.error;

  if (contractResult.error && isTableMissingError(contractResult.error)) missingTables.add('client_contracts');
  if (tasksResult.error && isTableMissingError(tasksResult.error)) missingTables.add('client_tasks');
  if (contactsResult.error && isTableMissingError(contactsResult.error)) missingTables.add('client_contacts');
  if (manualDeadlinesResult.error && isTableMissingError(manualDeadlinesResult.error)) {
    missingTables.add('client_deadlines');
  }
  if (notesResult.error && isTableMissingError(notesResult.error)) missingTables.add('client_notes');

  const notesRows = (notesResult.data ?? []) as ClientNoteRecord[];
  const authorIds = Array.from(new Set(notesRows.map((note) => note.created_by).filter(Boolean)));

  const authorMap = new Map<string, string>();
  if (authorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', authorIds);

    if (!profilesError) {
      for (const profile of profiles ?? []) {
        authorMap.set(profile.id, profile.email ?? profile.id);
      }
    }
  }

  const notes = notesRows.map((note) => ({
    ...note,
    author_name: note.created_by ? authorMap.get(note.created_by) ?? null : null,
  }));

  const contacts = ((contactsResult.data ?? []) as ClientContactRecord[]).map((contact) => ({
    ...contact,
    department: contact.department ?? null,
    is_active: contact.is_active ?? true,
    location_id: contact.location_id ?? null,
  }));

  return {
    contract: (contractResult.data as ClientContractRecord | null) ?? null,
    tasks: (tasksResult.data as ClientTaskRecord[]) ?? [],
    contacts,
    manualDeadlines: (manualDeadlinesResult.data as ClientManualDeadlineRecord[]) ?? [],
    notes,
    missingTables: Array.from(missingTables),
  };
}
