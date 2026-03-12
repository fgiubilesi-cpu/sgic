'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  MapPin,
  ScrollText,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ClientDetail } from '@/features/clients/queries/get-client';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type { PersonnelListItem } from '@/features/personnel/queries/get-personnel';
import { ClientForm } from './client-form';
import { ManageLocationSheet } from './manage-location-sheet';
import { ManagePersonnelSheet } from '@/features/personnel/components/manage-personnel-sheet';
import { CreateAuditSheet } from '@/features/audits/components/create-audit-sheet';
import { ClientStateToggleButton } from './client-state-toggle-button';
import { LocationStateToggleButton } from './location-state-toggle-button';
import { PersonnelOperationalBadge } from '@/features/personnel/components/personnel-operational-badge';
import { PersonnelStateToggleButton } from '@/features/personnel/components/personnel-state-toggle-button';
import type { AuditTimelineEvent } from '@/features/audits/queries/get-audit-timeline';
import { ClientAuditInsights } from './client-audit-insights';
import type { DocumentListItem } from '@/features/documents/queries/get-documents';
import { ManageDocumentSheet } from '@/features/documents/components/manage-document-sheet';
import { DocumentsTable } from '@/features/documents/components/documents-table';
import {
  ManageContactSheet,
  ManageDeadlineSheet,
  ManageNoteSheet,
  ManageTaskSheet,
  NotePinAction,
  TaskStatusQuickAction,
} from '@/features/clients/components/client-workspace-controls';
import {
  upsertClientContract,
} from '@/features/clients/actions/client-workspace-actions';
import type {
  ClientContactRecord,
  ClientContractRecord,
  ClientManualDeadlineRecord,
  ClientNoteRecord,
  ClientTaskPriority,
  ClientTaskRecord,
  ClientTaskStatus,
} from '@/features/clients/queries/get-client-workspace';

type ClientAuditItem = {
  id: string;
  nc_count: number;
  title: string | null;
  status: string;
  scheduled_date: string | null;
  score: number | null;
  location_id: string | null;
  location_name: string | null;
};

type ClientTab =
  | 'overview'
  | 'activities'
  | 'contract'
  | 'org-chart'
  | 'locations'
  | 'audits'
  | 'documents'
  | 'deadlines'
  | 'notes';

interface ClientDetailWorkspaceProps {
  audits: ClientAuditItem[];
  client: ClientDetail;
  clientOptions: ClientOption[];
  contacts: ClientContactRecord[];
  contract: ClientContractRecord | null;
  documents: DocumentListItem[];
  manualDeadlines: ClientManualDeadlineRecord[];
  missingWorkspaceTables: string[];
  notes: ClientNoteRecord[];
  openNcCount: number;
  personnel: PersonnelListItem[];
  tasks: ClientTaskRecord[];
  timelineEvents: AuditTimelineEvent[];
}

type AggregatedDeadline = {
  description: string | null;
  due_date: string;
  href: string | null;
  id: string;
  location_id: string | null;
  priority: ClientTaskPriority;
  source_type: 'manual' | 'contract' | 'task' | 'document' | 'audit';
  status: 'open' | 'completed' | 'cancelled';
  title: string;
};

const tabs: Array<{ id: ClientTab; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'activities', label: 'Attività', icon: CheckCircle2 },
  { id: 'contract', label: 'Contratto', icon: ScrollText },
  { id: 'org-chart', label: 'Org Chart', icon: Users },
  { id: 'locations', label: 'Sedi', icon: MapPin },
  { id: 'audits', label: 'Audit', icon: ClipboardCheck },
  { id: 'documents', label: 'Documenti', icon: FileText },
  { id: 'deadlines', label: 'Scadenze', icon: CalendarClock },
  { id: 'notes', label: 'Note', icon: ShieldAlert },
];

function toDateLabel(value: string | null | undefined) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('it-IT');
}

function toDateStart(value: string) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function taskStatusLabel(status: ClientTaskStatus) {
  if (status === 'open') return 'Aperta';
  if (status === 'in_progress') return 'In lavorazione';
  if (status === 'blocked') return 'Bloccata';
  return 'Completata';
}

function priorityLabel(priority: ClientTaskPriority) {
  if (priority === 'low') return 'Bassa';
  if (priority === 'medium') return 'Media';
  if (priority === 'high') return 'Alta';
  return 'Critica';
}

function priorityBadgeClass(priority: ClientTaskPriority) {
  if (priority === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (priority === 'high') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (priority === 'medium') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-zinc-200 bg-zinc-50 text-zinc-600';
}

function taskStatusBadgeClass(status: ClientTaskStatus) {
  if (status === 'done') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'in_progress') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (status === 'blocked') return 'border-rose-200 bg-rose-50 text-rose-700';
  return 'border-zinc-200 bg-zinc-50 text-zinc-700';
}

function sourceTypeLabel(sourceType: AggregatedDeadline['source_type']) {
  if (sourceType === 'manual') return 'Manuale';
  if (sourceType === 'contract') return 'Contratto';
  if (sourceType === 'task') return 'Attività';
  if (sourceType === 'document') return 'Documento';
  return 'Audit';
}

function sourceTypeBadgeClass(sourceType: AggregatedDeadline['source_type']) {
  if (sourceType === 'contract') return 'border-violet-200 bg-violet-50 text-violet-700';
  if (sourceType === 'task') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (sourceType === 'document') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (sourceType === 'audit') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return 'border-zinc-200 bg-zinc-50 text-zinc-700';
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringOrNull(value: unknown) {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function getDocumentProposal(document: DocumentListItem) {
  const payload = asObject(document.extracted_payload);
  const proposal = asObject(payload?.proposal ?? document.extracted_payload);
  return proposal;
}

function getContractProposal(document: DocumentListItem) {
  const proposal = getDocumentProposal(document);
  return asObject(proposal?.contract);
}

function computeRiskLevel({
  openNcCount,
  overdueDeadlines,
  overdueTasks,
}: {
  openNcCount: number;
  overdueDeadlines: number;
  overdueTasks: number;
}) {
  const riskScore = openNcCount * 2 + overdueDeadlines + overdueTasks;
  if (riskScore >= 8) {
    return {
      label: 'Rischio alto',
      className: 'border-rose-200 bg-rose-50 text-rose-700',
    };
  }
  if (riskScore >= 4) {
    return {
      label: 'Rischio medio',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
    };
  }
  return {
    label: 'Rischio sotto controllo',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
}

export function ClientDetailWorkspace({
  audits,
  client,
  clientOptions,
  contacts,
  contract,
  documents,
  manualDeadlines,
  missingWorkspaceTables,
  notes,
  openNcCount,
  personnel,
  tasks,
  timelineEvents,
}: ClientDetailWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ClientTab>('overview');
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatus, setTaskStatus] = useState<'all' | ClientTaskStatus>('all');
  const [taskPriority, setTaskPriority] = useState<'all' | ClientTaskPriority>('all');
  const [docSearch, setDocSearch] = useState('');
  const [docCategory, setDocCategory] = useState<string>('all');
  const [docStatus, setDocStatus] = useState<string>('all');
  const [docIngestion, setDocIngestion] = useState<string>('all');
  const [docScope, setDocScope] = useState<'all' | 'client' | 'location' | 'personnel'>('all');
  const [deadlineSource, setDeadlineSource] =
    useState<'all' | AggregatedDeadline['source_type']>('all');
  const [deadlineStatus, setDeadlineStatus] =
    useState<'all' | AggregatedDeadline['status']>('all');
  const [deadlineUrgency, setDeadlineUrgency] = useState<'all' | 'overdue' | 'upcoming'>('all');
  const [noteType, setNoteType] = useState<'all' | ClientNoteRecord['note_type']>('all');
  const [contractForm, setContractForm] = useState({
    contract_type: contract?.contract_type ?? 'standard',
    status: contract?.status ?? 'active',
    start_date: contract?.start_date ?? '',
    renewal_date: contract?.renewal_date ?? '',
    end_date: contract?.end_date ?? '',
    service_scope: contract?.service_scope ?? '',
    activity_frequency: contract?.activity_frequency ?? '',
    internal_owner: contract?.internal_owner ?? '',
    notes: contract?.notes ?? '',
    attachment_url: contract?.attachment_url ?? '',
  });
  const [savingContract, startSavingContract] = useTransition();
  const isClientActive = client.is_active ?? true;
  const locationMap = useMemo(
    () => new Map(client.locations.map((location) => [location.id, location.name])),
    [client.locations]
  );
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  useEffect(() => {
    setContractForm({
      contract_type: contract?.contract_type ?? 'standard',
      status: contract?.status ?? 'active',
      start_date: contract?.start_date ?? '',
      renewal_date: contract?.renewal_date ?? '',
      end_date: contract?.end_date ?? '',
      service_scope: contract?.service_scope ?? '',
      activity_frequency: contract?.activity_frequency ?? '',
      internal_owner: contract?.internal_owner ?? '',
      notes: contract?.notes ?? '',
      attachment_url: contract?.attachment_url ?? '',
    });
  }, [contract]);

  const aggregatedDeadlines = useMemo<AggregatedDeadline[]>(() => {
    const list: AggregatedDeadline[] = [];

    for (const deadline of manualDeadlines) {
      list.push({
        id: deadline.id,
        source_type: 'manual',
        title: deadline.title,
        description: deadline.description,
        due_date: deadline.due_date,
        priority: deadline.priority,
        status: deadline.status,
        location_id: deadline.location_id,
        href: null,
      });
    }

    if (contract?.renewal_date) {
      list.push({
        id: `contract-renewal-${client.id}`,
        source_type: 'contract',
        title: 'Rinnovo contratto',
        description: `Contratto ${contract.contract_type}`,
        due_date: contract.renewal_date,
        priority: 'high',
        status: contract.status === 'expired' ? 'cancelled' : 'open',
        location_id: null,
        href: null,
      });
    }

    if (contract?.end_date) {
      list.push({
        id: `contract-end-${client.id}`,
        source_type: 'contract',
        title: 'Scadenza contratto',
        description: `Contratto ${contract.contract_type}`,
        due_date: contract.end_date,
        priority: 'critical',
        status: contract.status === 'expired' ? 'completed' : 'open',
        location_id: null,
        href: null,
      });
    }

    for (const task of tasks) {
      if (!task.due_date) continue;
      list.push({
        id: `task-${task.id}`,
        source_type: 'task',
        title: task.title,
        description: task.description,
        due_date: task.due_date,
        priority: task.priority,
        status: task.status === 'done' ? 'completed' : 'open',
        location_id: task.location_id,
        href: null,
      });
    }

    for (const document of documents) {
      if (!document.expiry_date) continue;
      const due = toDateStart(document.expiry_date);
      const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      list.push({
        id: `document-${document.id}`,
        source_type: 'document',
        title: document.title ?? 'Documento senza titolo',
        description: document.description,
        due_date: document.expiry_date,
        priority: diffDays <= 14 ? 'high' : diffDays <= 30 ? 'medium' : 'low',
        status: document.status === 'archived' ? 'completed' : 'open',
        location_id: document.location_id,
        href: null,
      });
    }

    for (const audit of audits) {
      if (!audit.scheduled_date) continue;
      if (audit.status === 'Closed') continue;
      list.push({
        id: `audit-${audit.id}`,
        source_type: 'audit',
        title: audit.title || 'Audit senza titolo',
        description: `Stato audit: ${audit.status}`,
        due_date: audit.scheduled_date,
        priority: audit.status === 'In Progress' ? 'high' : 'medium',
        status: 'open',
        location_id: audit.location_id,
        href: `/audits/${audit.id}`,
      });
    }

    return list.sort((left, right) => {
      return toDateStart(left.due_date).getTime() - toDateStart(right.due_date).getTime();
    });
  }, [audits, client.id, contract, documents, manualDeadlines, tasks, today]);

  const documentExpiringSoonCount = documents.filter((document) => {
    if (!document.expiry_date) return false;
    const expiry = toDateStart(document.expiry_date);
    const inThirtyDays = new Date(today);
    inThirtyDays.setDate(today.getDate() + 30);
    return expiry >= today && expiry <= inThirtyDays;
  }).length;

  const documentExpiredCount = documents.filter((document) => {
    if (!document.expiry_date) return false;
    return toDateStart(document.expiry_date) < today;
  }).length;
  const documentReviewQueue = documents.filter(
    (document) => document.ingestion_status === 'review_required' || document.ingestion_status === 'failed'
  );
  const linkedDocumentCount = documents.filter((document) => document.ingestion_status === 'linked').length;
  const versionedDocumentCount = documents.filter((document) => document.version_count > 1).length;
  const contractDocumentMismatches = documents.filter((document) => {
    if (document.category !== 'Contract' || !contract) return false;
    const proposal = getContractProposal(document);
    if (!proposal) return false;

    const proposalStartDate = stringOrNull(proposal.start_date);
    const proposalRenewalDate = stringOrNull(proposal.renewal_date);
    const proposalEndDate = stringOrNull(proposal.end_date);
    const proposalType = stringOrNull(proposal.contract_type);

    return (
      (proposalType !== null && proposalType !== (contract.contract_type ?? null)) ||
      (proposalStartDate !== null && proposalStartDate !== (contract.start_date ?? null)) ||
      (proposalRenewalDate !== null && proposalRenewalDate !== (contract.renewal_date ?? null)) ||
      (proposalEndDate !== null && proposalEndDate !== (contract.end_date ?? null))
    );
  });

  const openTasks = tasks.filter((task) => task.status !== 'done');
  const completedTasks = tasks.filter((task) => task.status === 'done');
  const overdueTasks = openTasks.filter((task) => {
    if (!task.due_date) return false;
    return toDateStart(task.due_date) < today;
  });
  const overdueDeadlines = aggregatedDeadlines.filter(
    (deadline) => deadline.status === 'open' && toDateStart(deadline.due_date) < today
  );
  const upcomingDeadlines = aggregatedDeadlines.filter((deadline) => {
    if (deadline.status !== 'open') return false;
    const dueDate = toDateStart(deadline.due_date);
    const inThirtyDays = new Date(today);
    inThirtyDays.setDate(today.getDate() + 30);
    return dueDate >= today && dueDate <= inThirtyDays;
  });

  const riskLevel = computeRiskLevel({
    openNcCount,
    overdueDeadlines: overdueDeadlines.length,
    overdueTasks: overdueTasks.length,
  });

  const stats = [
    { label: 'Task aperte', value: openTasks.length },
    { label: 'Scadenze urgenti', value: overdueDeadlines.length + upcomingDeadlines.length },
    { label: 'Contatti attivi', value: contacts.filter((contact) => contact.is_active).length },
    { label: 'Sedi operative', value: client.locations.filter((location) => location.is_active ?? true).length },
    { label: 'NC aperte', value: openNcCount },
    { label: 'Documenti in scadenza', value: documentExpiringSoonCount + documentExpiredCount },
  ];

  const nextActions = openTasks
    .sort((left, right) => {
      if (!left.due_date && !right.due_date) return 0;
      if (!left.due_date) return 1;
      if (!right.due_date) return -1;
      return toDateStart(left.due_date).getTime() - toDateStart(right.due_date).getTime();
    })
    .slice(0, 5);

  const keyContacts = contacts
    .filter((contact) => contact.is_active)
    .sort((left, right) => Number(right.is_primary) - Number(left.is_primary))
    .slice(0, 5);

  const healthAlerts = [
    openNcCount > 0
      ? `${openNcCount} non conformità aperte da presidiare.`
      : 'Nessuna non conformità aperta.',
    overdueTasks.length > 0
      ? `${overdueTasks.length} attività sono oltre scadenza.`
      : 'Nessuna attività in ritardo.',
    documentExpiredCount > 0
      ? `${documentExpiredCount} documenti risultano scaduti.`
      : 'Nessun documento scaduto.',
    documentReviewQueue.length > 0
      ? `${documentReviewQueue.length} documenti attendono review intake.`
      : 'Nessun documento in coda review.',
    contractDocumentMismatches.length > 0
      ? `${contractDocumentMismatches.length} contratti documentali non sono allineati al workspace.`
      : 'Nessun mismatch rilevato tra documenti contratto e tab contratto.',
    contract?.end_date
      ? `Contratto in scadenza il ${toDateLabel(contract.end_date)}.`
      : 'Scadenza contratto non configurata.',
  ];

  const taskOwners = Array.from(
    new Set(tasks.map((task) => task.owner_name).filter((owner): owner is string => Boolean(owner)))
  );

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      taskSearch.trim() === '' ||
      task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      (task.description ?? '').toLowerCase().includes(taskSearch.toLowerCase()) ||
      (task.owner_name ?? '').toLowerCase().includes(taskSearch.toLowerCase());
    const matchesStatus = taskStatus === 'all' || task.status === taskStatus;
    const matchesPriority = taskPriority === 'all' || task.priority === taskPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const categories = Array.from(
    new Set(
      documents
        .map((document) => document.category)
        .filter(
          (category): category is NonNullable<DocumentListItem['category']> => Boolean(category)
        )
    )
  );

  const filteredDocuments = documents.filter((document) => {
    const search = docSearch.trim().toLowerCase();
    const matchesSearch =
      search === '' ||
      (document.title ?? '').toLowerCase().includes(search) ||
      (document.description ?? '').toLowerCase().includes(search) ||
      (document.file_name ?? '').toLowerCase().includes(search);
    const matchesCategory = docCategory === 'all' || document.category === docCategory;
    const matchesStatus = docStatus === 'all' || document.status === docStatus;
    const matchesIngestion = docIngestion === 'all' || document.ingestion_status === docIngestion;
    const matchesScope =
      docScope === 'all' ||
      (docScope === 'client' && Boolean(document.client_id && !document.location_id && !document.personnel_id)) ||
      (docScope === 'location' && Boolean(document.location_id)) ||
      (docScope === 'personnel' && Boolean(document.personnel_id));
    return matchesSearch && matchesCategory && matchesStatus && matchesIngestion && matchesScope;
  });

  const filteredDeadlines = aggregatedDeadlines.filter((deadline) => {
    const matchesSource = deadlineSource === 'all' || deadline.source_type === deadlineSource;
    const matchesStatus = deadlineStatus === 'all' || deadline.status === deadlineStatus;
    const dueDate = toDateStart(deadline.due_date);
    const inThirtyDays = new Date(today);
    inThirtyDays.setDate(today.getDate() + 30);
    const matchesUrgency =
      deadlineUrgency === 'all' ||
      (deadlineUrgency === 'overdue' && deadline.status === 'open' && dueDate < today) ||
      (deadlineUrgency === 'upcoming' &&
        deadline.status === 'open' &&
        dueDate >= today &&
        dueDate <= inThirtyDays);
    return matchesSource && matchesStatus && matchesUrgency;
  });

  const filteredNotes = notes.filter((note) => noteType === 'all' || note.note_type === noteType);

  const locationInsights = client.locations.map((location) => {
    const locationAudits = audits.filter((audit) => audit.location_id === location.id);
    const locationTasks = openTasks.filter((task) => task.location_id === location.id);
    const locationDocuments = documents.filter((document) => document.location_id === location.id);
    const locationContacts = contacts.filter((contact) => contact.location_id === location.id);
    const nextLocationDeadline = aggregatedDeadlines.find(
      (deadline) => deadline.location_id === location.id && deadline.status === 'open'
    );
    return {
      location,
      audits: locationAudits.length,
      tasks: locationTasks.length,
      documents: locationDocuments.length,
      contacts: locationContacts.length,
      nextDeadline: nextLocationDeadline?.due_date ?? null,
    };
  });

  const closedAudits = audits.filter((audit) => audit.status === 'Closed').length;
  const scheduledAudits = audits.filter((audit) => audit.status === 'Scheduled').length;
  const averageScore =
    audits.filter((audit) => typeof audit.score === 'number').reduce((sum, audit) => sum + (audit.score ?? 0), 0) /
      Math.max(audits.filter((audit) => typeof audit.score === 'number').length, 1);

  const saveContract = () => {
    startSavingContract(async () => {
      const result = await upsertClientContract(client.id, contractForm);
      if (!result.success) {
        toast.error(result.error ?? 'Impossibile salvare contratto');
        return;
      }
      toast.success('Contratto aggiornato');
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Button asChild variant="ghost" className="px-0 text-zinc-500 hover:bg-transparent">
            <Link href="/clients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Torna ai clienti
            </Link>
          </Button>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
              <Badge variant="outline" className={riskLevel.className}>
                {riskLevel.label}
              </Badge>
            </div>
            <p className="text-sm text-zinc-600">
              Dossier operativo completo: contratto, attività, contatti, sedi, audit, documenti,
              scadenze e note interne.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ClientStateToggleButton clientId={client.id} isActive={isClientActive} />
          <ManageTaskSheet
            audits={audits.map((audit) => ({ id: audit.id, title: audit.title }))}
            clientId={client.id}
            locations={client.locations.map((location) => ({ id: location.id, name: location.name }))}
          />
          <ManageLocationSheet clientId={client.id} />
          <CreateAuditSheet defaultClientId={client.id} hideClientField triggerLabel="Nuovo Audit" />
          <ManageDocumentSheet
            clientOptions={clientOptions}
            defaultClientId={client.id}
            personnelOptions={personnel}
            triggerLabel="Nuovo Documento"
          />
          <Button variant="outline" onClick={() => setActiveTab('contract')}>
            Apri contratto
          </Button>
        </div>
      </div>

      {missingWorkspaceTables.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium">Workspace parzialmente attivo</p>
          <p className="mt-1">
            Le tabelle <span className="font-semibold">{missingWorkspaceTables.join(', ')}</span> non
            risultano disponibili nel database corrente. Esegui le migration del branch per attivare
            tutte le funzionalità.
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-zinc-200 bg-white/90 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-zinc-900">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-2 border-b px-4 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  isActive
                    ? 'inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white'
                    : 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100'
                }
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {activeTab === 'overview' ? (
            <div className="space-y-4">
              <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Health & alert</CardTitle>
                    <CardDescription>Segnali prioritari da monitorare nelle prossime settimane.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {healthAlerts.map((alert) => (
                      <div
                        key={alert}
                        className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700"
                      >
                        {alert}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Prossime attività</CardTitle>
                    <CardDescription>Backlog operativo ordinato per urgenza e priorità.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {nextActions.length === 0 ? (
                      <p className="text-sm text-zinc-500">Nessuna attività aperta.</p>
                    ) : (
                      nextActions.map((task) => (
                        <div
                          key={task.id}
                          className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{task.title}</p>
                              <p className="text-xs text-zinc-500">
                                {task.owner_name || 'Assegnatario da definire'} · scadenza {toDateLabel(task.due_date)}
                              </p>
                            </div>
                            <Badge variant="outline" className={priorityBadgeClass(task.priority)}>
                              {priorityLabel(task.priority)}
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Prossime scadenze</CardTitle>
                    <CardDescription>Vista unificata su contratto, task, audit, documenti e manuali.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {aggregatedDeadlines.filter((deadline) => deadline.status === 'open').slice(0, 5).length === 0 ? (
                      <p className="text-sm text-zinc-500">Nessuna scadenza aperta.</p>
                    ) : (
                      aggregatedDeadlines
                        .filter((deadline) => deadline.status === 'open')
                        .slice(0, 5)
                        .map((deadline) => (
                          <div
                            key={deadline.id}
                            className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium text-zinc-900">{deadline.title}</p>
                              <p className="text-xs text-zinc-500">
                                {sourceTypeLabel(deadline.source_type)} · {toDateLabel(deadline.due_date)}
                              </p>
                            </div>
                            <Badge variant="outline" className={priorityBadgeClass(deadline.priority)}>
                              {priorityLabel(deadline.priority)}
                            </Badge>
                          </div>
                        ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contatti chiave</CardTitle>
                    <CardDescription>Referenti cliente più rilevanti per l’operatività.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {keyContacts.length === 0 ? (
                      <p className="text-sm text-zinc-500">Nessun contatto cliente attivo.</p>
                    ) : (
                      keyContacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm"
                        >
                          <p className="font-medium text-zinc-900">{contact.full_name}</p>
                          <p className="text-xs text-zinc-500">
                            {contact.role || 'Ruolo non definito'}
                            {contact.department ? ` · ${contact.department}` : ''}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {contact.email || 'Email n.d.'}
                            {contact.phone ? ` · ${contact.phone}` : ''}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contratto corrente</CardTitle>
                    <CardDescription>Perimetro servizio e milestone contrattuali.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Tipo</p>
                      <p className="font-medium text-zinc-900">{contract?.contract_type ?? 'Non configurato'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Stato</p>
                      <p className="font-medium text-zinc-900">{contract?.status ?? 'Non impostato'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">Scadenza</p>
                      <p className="font-medium text-zinc-900">{toDateLabel(contract?.end_date)}</p>
                    </div>
                    <Button variant="outline" className="w-full" onClick={() => setActiveTab('contract')}>
                      Gestisci contratto
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Anagrafica cliente</CardTitle>
                  <CardDescription>Dati amministrativi e note base del cliente.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ClientForm client={client} />
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'activities' ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Task operative ({tasks.length})</CardTitle>
                    <CardDescription>Lista lavoro interna con priorità, stato e scadenze.</CardDescription>
                  </div>
                  <ManageTaskSheet
                    audits={audits.map((audit) => ({ id: audit.id, title: audit.title }))}
                    clientId={client.id}
                    locations={client.locations.map((location) => ({ id: location.id, name: location.name }))}
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Cerca</Label>
                      <Input
                        value={taskSearch}
                        onChange={(event) => setTaskSearch(event.target.value)}
                        placeholder="Titolo, descrizione o assegnatario..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stato</Label>
                      <select
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={taskStatus}
                        onChange={(event) => setTaskStatus(event.target.value as 'all' | ClientTaskStatus)}
                      >
                        <option value="all">Tutti</option>
                        <option value="open">Aperte</option>
                        <option value="in_progress">In lavorazione</option>
                        <option value="blocked">Bloccate</option>
                        <option value="done">Completate</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Priorità</Label>
                      <select
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={taskPriority}
                        onChange={(event) =>
                          setTaskPriority(event.target.value as 'all' | ClientTaskPriority)
                        }
                      >
                        <option value="all">Tutte</option>
                        <option value="low">Bassa</option>
                        <option value="medium">Media</option>
                        <option value="high">Alta</option>
                        <option value="critical">Critica</option>
                      </select>
                    </div>
                  </div>

                  {taskOwners.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {taskOwners.map((owner) => (
                        <span
                          key={owner}
                          className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600"
                        >
                          {owner}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {filteredTasks.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nessuna attività coerente con i filtri.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titolo</TableHead>
                          <TableHead>Assegnatario</TableHead>
                          <TableHead>Scadenza</TableHead>
                          <TableHead>Priorità</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Contesto</TableHead>
                          <TableHead>Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTasks.map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-zinc-900">{task.title}</p>
                                <p className="text-xs text-zinc-500">{task.description || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell>{task.owner_name || '-'}</TableCell>
                            <TableCell>{toDateLabel(task.due_date)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={priorityBadgeClass(task.priority)}>
                                {priorityLabel(task.priority)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={taskStatusBadgeClass(task.status)}>
                                {taskStatusLabel(task.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-zinc-500">
                                <div>
                                  Sede:{' '}
                                  {task.location_id
                                    ? locationMap.get(task.location_id) ?? 'Sede rimossa'
                                    : '-'}
                                </div>
                                <div>Audit: {task.audit_id ? 'Collegato' : '-'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-1">
                                <TaskStatusQuickAction
                                  clientId={client.id}
                                  status={task.status}
                                  taskId={task.id}
                                />
                                <ManageTaskSheet
                                  audits={audits.map((audit) => ({ id: audit.id, title: audit.title }))}
                                  clientId={client.id}
                                  locations={client.locations.map((location) => ({
                                    id: location.id,
                                    name: location.name,
                                  }))}
                                  task={task}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>In corso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold text-sky-700">
                      {tasks.filter((task) => task.status === 'in_progress').length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Bloccate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold text-rose-700">
                      {tasks.filter((task) => task.status === 'blocked').length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Completate (30gg)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold text-emerald-700">
                      {
                        completedTasks.filter((task) => {
                          if (!task.completed_at) return false;
                          const completionDate = toDateStart(task.completed_at);
                          const thirtyDaysAgo = new Date(today);
                          thirtyDaysAgo.setDate(today.getDate() - 30);
                          return completionDate >= thirtyDaysAgo;
                        }).length
                      }
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}

          {activeTab === 'contract' ? (
            <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Perimetro contrattuale</CardTitle>
                  <CardDescription>
                    Definisci contratto corrente, milestone e servizi inclusi.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo contratto</Label>
                      <Input
                        value={contractForm.contract_type}
                        onChange={(event) =>
                          setContractForm((prev) => ({ ...prev, contract_type: event.target.value }))
                        }
                        placeholder="Es. HACCP Full Service"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stato</Label>
                      <select
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={contractForm.status}
                        onChange={(event) =>
                          setContractForm((prev) => ({
                            ...prev,
                            status: event.target.value as ClientContractRecord['status'],
                          }))
                        }
                      >
                        <option value="draft">Bozza</option>
                        <option value="active">Attivo</option>
                        <option value="paused">Sospeso</option>
                        <option value="expired">Scaduto</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Data inizio</Label>
                      <Input
                        type="date"
                        value={contractForm.start_date ?? ''}
                        onChange={(event) =>
                          setContractForm((prev) => ({ ...prev, start_date: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data rinnovo</Label>
                      <Input
                        type="date"
                        value={contractForm.renewal_date ?? ''}
                        onChange={(event) =>
                          setContractForm((prev) => ({ ...prev, renewal_date: event.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data scadenza</Label>
                      <Input
                        type="date"
                        value={contractForm.end_date ?? ''}
                        onChange={(event) =>
                          setContractForm((prev) => ({ ...prev, end_date: event.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Servizi inclusi</Label>
                    <Textarea
                      rows={3}
                      value={contractForm.service_scope ?? ''}
                      onChange={(event) =>
                        setContractForm((prev) => ({ ...prev, service_scope: event.target.value }))
                      }
                      placeholder="Elenca perimetro operativo, SLA e deliverable"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Frequenza attività previste</Label>
                      <Input
                        value={contractForm.activity_frequency ?? ''}
                        onChange={(event) =>
                          setContractForm((prev) => ({
                            ...prev,
                            activity_frequency: event.target.value,
                          }))
                        }
                        placeholder="Es. Audit mensile + review trimestrale"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Referente interno</Label>
                      <Input
                        value={contractForm.internal_owner ?? ''}
                        onChange={(event) =>
                          setContractForm((prev) => ({ ...prev, internal_owner: event.target.value }))
                        }
                        placeholder="Es. f.giubilesi@..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>URL allegato contratto</Label>
                    <Input
                      value={contractForm.attachment_url ?? ''}
                      onChange={(event) =>
                        setContractForm((prev) => ({ ...prev, attachment_url: event.target.value }))
                      }
                      placeholder="https://..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Note contrattuali</Label>
                    <Textarea
                      rows={4}
                      value={contractForm.notes ?? ''}
                      onChange={(event) =>
                        setContractForm((prev) => ({ ...prev, notes: event.target.value }))
                      }
                      placeholder="Vincoli, eccezioni, extra-canone, ecc."
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={saveContract}
                    disabled={savingContract || contractForm.contract_type.trim() === ''}
                    className="w-full"
                  >
                    {savingContract ? 'Salvataggio...' : 'Salva contratto'}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sintesi contratto</CardTitle>
                  <CardDescription>
                    Dati chiave per lettura rapida e alimentazione scadenze.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Tipo</p>
                    <p className="font-medium text-zinc-900">{contractForm.contract_type || '-'}</p>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Stato</p>
                    <p className="font-medium text-zinc-900">{contractForm.status}</p>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Rinnovo</p>
                    <p className="font-medium text-zinc-900">{toDateLabel(contractForm.renewal_date)}</p>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Scadenza</p>
                    <p className="font-medium text-zinc-900">{toDateLabel(contractForm.end_date)}</p>
                  </div>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Owner interno</p>
                    <p className="font-medium text-zinc-900">{contractForm.internal_owner || '-'}</p>
                  </div>
                  {contractForm.attachment_url ? (
                    <Button asChild variant="outline" className="w-full">
                      <a href={contractForm.attachment_url} target="_blank" rel="noreferrer">
                        Apri allegato contratto
                      </a>
                    </Button>
                  ) : (
                    <p className="text-xs text-zinc-500">Nessun allegato contratto collegato.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'org-chart' ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Contatti cliente ({contacts.length})</CardTitle>
                    <CardDescription>Mappa referenti cliente per ruolo, area e sede.</CardDescription>
                  </div>
                  <ManageContactSheet
                    clientId={client.id}
                    locations={client.locations.map((location) => ({ id: location.id, name: location.name }))}
                  />
                </CardHeader>
                <CardContent>
                  {contacts.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nessun contatto cliente registrato.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contatto</TableHead>
                          <TableHead>Ruolo/Area</TableHead>
                          <TableHead>Sede</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contacts.map((contact) => (
                          <TableRow key={contact.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-zinc-900">{contact.full_name}</p>
                                <p className="text-xs text-zinc-500">
                                  {contact.email || 'Email n.d.'}
                                  {contact.phone ? ` · ${contact.phone}` : ''}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-zinc-700">
                                <div>{contact.role || '-'}</div>
                                <div className="text-xs text-zinc-500">{contact.department || '-'}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {contact.location_id
                                ? locationMap.get(contact.location_id) ?? 'Sede rimossa'
                                : '-'}
                            </TableCell>
                            <TableCell>
                              <div className="space-x-1">
                                <Badge variant={contact.is_active ? 'default' : 'secondary'}>
                                  {contact.is_active ? 'Attivo' : 'Inattivo'}
                                </Badge>
                                {contact.is_primary ? (
                                  <Badge variant="outline">Principale</Badge>
                                ) : null}
                              </div>
                            </TableCell>
                            <TableCell>
                              <ManageContactSheet
                                clientId={client.id}
                                contact={contact}
                                locations={client.locations.map((location) => ({
                                  id: location.id,
                                  name: location.name,
                                }))}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Collaboratori SGIC ({personnel.length})</CardTitle>
                    <CardDescription>
                      Team interno collegato al cliente per operatività quotidiana.
                    </CardDescription>
                  </div>
                  <ManagePersonnelSheet clientOptions={clientOptions} defaultClientId={client.id} />
                </CardHeader>
                <CardContent>
                  {personnel.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nessun collaboratore interno assegnato.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Ruolo</TableHead>
                          <TableHead>Sede</TableHead>
                          <TableHead>Stato operativo</TableHead>
                          <TableHead>Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {personnel.map((person) => (
                          <TableRow key={person.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium text-zinc-900">
                                  {person.first_name} {person.last_name}
                                </p>
                                <p className="text-xs text-zinc-500">{person.email || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell>{person.role || '-'}</TableCell>
                            <TableCell>{person.location_name || '-'}</TableCell>
                            <TableCell>
                              <PersonnelOperationalBadge status={person.operational_status} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                                  <Link href={`/personnel/${person.id}`}>Dettagli</Link>
                                </Button>
                                <ManagePersonnelSheet
                                  clientOptions={clientOptions}
                                  defaultClientId={client.id}
                                  personnel={person}
                                />
                                <PersonnelStateToggleButton
                                  isActive={person.is_active}
                                  personnelId={person.id}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'locations' ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Sedi operative ({client.locations.length})</CardTitle>
                    <CardDescription>
                      Vista sedi arricchita con contesto operativo, audit, task e documenti.
                    </CardDescription>
                  </div>
                  <ManageLocationSheet clientId={client.id} />
                </CardHeader>
                <CardContent className="space-y-3">
                  {locationInsights.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nessuna sede registrata.</p>
                  ) : (
                    locationInsights.map((item) => (
                      <div key={item.location.id} className="rounded-lg border border-zinc-200 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-zinc-900">{item.location.name}</p>
                            <p className="text-xs text-zinc-500">
                              {item.location.city || '-'} · {item.location.type || 'Tipo non definito'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant={(item.location.is_active ?? true) ? 'default' : 'secondary'}>
                              {(item.location.is_active ?? true) ? 'Attiva' : 'Inattiva'}
                            </Badge>
                            <ManageLocationSheet clientId={client.id} location={item.location} />
                            <LocationStateToggleButton
                              isActive={item.location.is_active ?? true}
                              locationId={item.location.id}
                            />
                          </div>
                        </div>
                        <div className="mt-3 grid gap-2 sm:grid-cols-4">
                          <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                            Audit: <span className="font-semibold text-zinc-900">{item.audits}</span>
                          </div>
                          <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                            Task aperte:{' '}
                            <span className="font-semibold text-zinc-900">{item.tasks}</span>
                          </div>
                          <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                            Documenti:{' '}
                            <span className="font-semibold text-zinc-900">{item.documents}</span>
                          </div>
                          <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                            Prossima scadenza:{' '}
                            <span className="font-semibold text-zinc-900">{toDateLabel(item.nextDeadline)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'audits' ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Audit chiusi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-emerald-700">{closedAudits}</div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Audit pianificati
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-sky-700">{scheduledAudits}</div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Score medio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-amber-700">
                      {Number.isFinite(averageScore) ? `${averageScore.toFixed(1)}%` : '-'}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-zinc-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      NC aperte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-rose-700">{openNcCount}</div>
                  </CardContent>
                </Card>
              </div>

              <ClientAuditInsights audits={audits} timelineEvents={timelineEvents} />

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Audit ({audits.length})</CardTitle>
                    <CardDescription>
                      Storico audit collegati al cliente e punto di accesso per crearne di nuovi.
                    </CardDescription>
                  </div>
                  <CreateAuditSheet defaultClientId={client.id} hideClientField triggerLabel="Nuovo Audit" />
                </CardHeader>
                <CardContent>
                  {audits.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nessun audit collegato a questo cliente.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titolo</TableHead>
                          <TableHead>Sede</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>NC aperte</TableHead>
                          <TableHead>Apri</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {audits.map((audit) => (
                          <TableRow key={audit.id}>
                            <TableCell className="font-medium">{audit.title || 'Audit senza titolo'}</TableCell>
                            <TableCell>{audit.location_name || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{audit.status}</Badge>
                            </TableCell>
                            <TableCell>{toDateLabel(audit.scheduled_date)}</TableCell>
                            <TableCell>
                              {typeof audit.score === 'number' ? `${audit.score.toFixed(1)}%` : '-'}
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  audit.nc_count > 0
                                    ? 'inline-flex min-w-8 items-center justify-center rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700'
                                    : 'inline-flex min-w-8 items-center justify-center rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-500'
                                }
                              >
                                {audit.nc_count}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-blue-600">
                                <Link href={`/audits/${audit.id}`}>Apri audit</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'documents' ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      In coda review
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-amber-700">{documentReviewQueue.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Collegati
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-emerald-700">{linkedDocumentCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Revisionati
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-zinc-900">{versionedDocumentCount}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Mismatch contratto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-rose-700">{contractDocumentMismatches.length}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Archivio documentale ({documents.length})</CardTitle>
                    <CardDescription>
                      Repository operativo con categorie, stato e livello di contesto.
                    </CardDescription>
                  </div>
                  <ManageDocumentSheet
                    clientOptions={clientOptions}
                    defaultClientId={client.id}
                    personnelOptions={personnel}
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  {documentReviewQueue.length > 0 || contractDocumentMismatches.length > 0 ? (
                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                          <AlertTriangle className="h-4 w-4" />
                          Queue intake
                        </div>
                        <p className="mt-1 text-sm text-amber-700">
                          {documentReviewQueue.length > 0
                            ? `${documentReviewQueue.length} documenti richiedono review o sono andati in errore.`
                            : 'Nessun documento bloccato in intake.'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-rose-800">
                          <ShieldAlert className="h-4 w-4" />
                          Allineamento workspace
                        </div>
                        <p className="mt-1 text-sm text-rose-700">
                          {contractDocumentMismatches.length > 0
                            ? `${contractDocumentMismatches.length} documenti contratto propongono dati diversi dalla tab contratto.`
                            : 'Nessun mismatch rilevato sul contratto cliente.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      Archivio documentale allineato: nessuna review bloccata e nessun mismatch contratto rilevato.
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Ricerca</Label>
                      <Input
                        value={docSearch}
                        onChange={(event) => setDocSearch(event.target.value)}
                        placeholder="Titolo, descrizione o nome file"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <select
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={docCategory}
                        onChange={(event) => setDocCategory(event.target.value)}
                      >
                        <option value="all">Tutte</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Stato</Label>
                      <select
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={docStatus}
                        onChange={(event) => setDocStatus(event.target.value)}
                      >
                        <option value="all">Tutti</option>
                        <option value="draft">Bozza</option>
                        <option value="published">Pubblicato</option>
                        <option value="archived">Archiviato</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Intake</Label>
                      <select
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={docIngestion}
                        onChange={(event) => setDocIngestion(event.target.value)}
                      >
                        <option value="all">Tutti</option>
                        <option value="manual">Manuale</option>
                        <option value="uploaded">Caricato</option>
                        <option value="parsed">Estratto</option>
                        <option value="review_required">Da validare</option>
                        <option value="reviewed">Validato</option>
                        <option value="linked">Collegato</option>
                        <option value="failed">Errore</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Ambito</Label>
                      <select
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={docScope}
                        onChange={(event) =>
                          setDocScope(event.target.value as 'all' | 'client' | 'location' | 'personnel')
                        }
                      >
                        <option value="all">Tutti</option>
                        <option value="client">Cliente</option>
                        <option value="location">Sede</option>
                        <option value="personnel">Collaboratore</option>
                      </select>
                    </div>
                  </div>

                  <DocumentsTable
                    clientOptions={clientOptions}
                    documents={filteredDocuments}
                    emptyMessage="Nessun documento coerente con i filtri selezionati."
                    personnelOptions={personnel}
                  />
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'deadlines' ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Totale scadenze aperte
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-zinc-900">
                      {aggregatedDeadlines.filter((deadline) => deadline.status === 'open').length}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Scadute
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-rose-700">{overdueDeadlines.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs uppercase tracking-wide text-zinc-500">
                      Prossimi 30 giorni
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-amber-700">{upcomingDeadlines.length}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Scadenze aggregate</CardTitle>
                    <CardDescription>
                      Unica vista su manuali, contratto, documenti, task e piano audit.
                    </CardDescription>
                  </div>
                  <ManageDeadlineSheet
                    clientId={client.id}
                    locations={client.locations.map((location) => ({ id: location.id, name: location.name }))}
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Fonte</Label>
                      <select
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={deadlineSource}
                        onChange={(event) =>
                          setDeadlineSource(
                            event.target.value as 'all' | AggregatedDeadline['source_type']
                          )
                        }
                      >
                        <option value="all">Tutte</option>
                        <option value="manual">Manuale</option>
                        <option value="contract">Contratto</option>
                        <option value="task">Task</option>
                        <option value="document">Documento</option>
                        <option value="audit">Audit</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Stato</Label>
                      <select
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={deadlineStatus}
                        onChange={(event) =>
                          setDeadlineStatus(event.target.value as 'all' | AggregatedDeadline['status'])
                        }
                      >
                        <option value="all">Tutti</option>
                        <option value="open">Aperta</option>
                        <option value="completed">Completata</option>
                        <option value="cancelled">Annullata</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Urgenza</Label>
                      <select
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={deadlineUrgency}
                        onChange={(event) =>
                          setDeadlineUrgency(event.target.value as 'all' | 'overdue' | 'upcoming')
                        }
                      >
                        <option value="all">Tutte</option>
                        <option value="overdue">Scadute</option>
                        <option value="upcoming">Prossimi 30 giorni</option>
                      </select>
                    </div>
                  </div>

                  {filteredDeadlines.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nessuna scadenza coerente con i filtri.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titolo</TableHead>
                          <TableHead>Fonte</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Priorità</TableHead>
                          <TableHead>Sede</TableHead>
                          <TableHead>Stato</TableHead>
                          <TableHead>Azioni</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredDeadlines.map((deadline) => {
                          const manualDeadline = manualDeadlines.find((item) => item.id === deadline.id);
                          return (
                            <TableRow key={deadline.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-zinc-900">{deadline.title}</p>
                                  <p className="text-xs text-zinc-500">{deadline.description || '-'}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={sourceTypeBadgeClass(deadline.source_type)}>
                                  {sourceTypeLabel(deadline.source_type)}
                                </Badge>
                              </TableCell>
                              <TableCell>{toDateLabel(deadline.due_date)}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={priorityBadgeClass(deadline.priority)}>
                                  {priorityLabel(deadline.priority)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {deadline.location_id
                                  ? locationMap.get(deadline.location_id) ?? 'Sede rimossa'
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <Badge variant={deadline.status === 'open' ? 'default' : 'secondary'}>
                                  {deadline.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {deadline.href ? (
                                    <Button asChild variant="outline" size="sm">
                                      <Link href={deadline.href}>Apri</Link>
                                    </Button>
                                  ) : null}
                                  {manualDeadline ? (
                                    <ManageDeadlineSheet
                                      clientId={client.id}
                                      deadline={manualDeadline}
                                      locations={client.locations.map((location) => ({
                                        id: location.id,
                                        name: location.name,
                                      }))}
                                    />
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {activeTab === 'notes' ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle>Note operative ({notes.length})</CardTitle>
                    <CardDescription>
                      Timeline interna di warning, decisioni e appunti contestuali.
                    </CardDescription>
                  </div>
                  <ManageNoteSheet
                    clientId={client.id}
                    locations={client.locations.map((location) => ({ id: location.id, name: location.name }))}
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Filtro tipo</Label>
                      <select
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm"
                        value={noteType}
                        onChange={(event) =>
                          setNoteType(event.target.value as 'all' | ClientNoteRecord['note_type'])
                        }
                      >
                        <option value="all">Tutte</option>
                        <option value="operational">Operative</option>
                        <option value="warning">Warning</option>
                        <option value="decision">Decisioni</option>
                        <option value="info">Info</option>
                      </select>
                    </div>
                    <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                      Uso interno: le note non sono visibili a clienti esterni.
                    </div>
                  </div>

                  {filteredNotes.length === 0 ? (
                    <p className="text-sm text-zinc-500">Nessuna nota coerente con i filtri.</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredNotes.map((note) => (
                        <div
                          key={note.id}
                          className={
                            note.pinned
                              ? 'rounded-md border border-amber-200 bg-amber-50 p-3'
                              : 'rounded-md border border-zinc-200 bg-zinc-50 p-3'
                          }
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-zinc-900">{note.title}</p>
                                <Badge variant="outline">{note.note_type}</Badge>
                                {note.pinned ? <Badge>Pinned</Badge> : null}
                              </div>
                              <p className="mt-1 text-xs text-zinc-500">
                                {toDateLabel(note.created_at)} · {note.author_name || 'Autore non disponibile'}
                                {note.location_id
                                  ? ` · ${locationMap.get(note.location_id) ?? 'Sede rimossa'}`
                                  : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <NotePinAction clientId={client.id} note={note} />
                              <ManageNoteSheet
                                clientId={client.id}
                                locations={client.locations.map((location) => ({
                                  id: location.id,
                                  name: location.name,
                                }))}
                                note={note}
                              />
                            </div>
                          </div>
                          <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{note.body}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
