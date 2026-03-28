'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ClientDetail } from '@/features/clients/queries/get-client';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type { PersonnelListItem } from '@/features/personnel/queries/get-personnel';
import { ManageLocationSheet } from './manage-location-sheet';
import { CreateAuditSheet } from '@/features/audits/components/create-audit-sheet';
import { ClientStateToggleButton } from './client-state-toggle-button';
import type { AuditTimelineEvent } from '@/features/audits/queries/get-audit-timeline';
import { ClientActivitiesTab } from './client-activities-tab';
import { ClientAuditsTab } from './client-audits-tab';
import { ClientContractTab } from './client-contract-tab';
import { ClientDeadlinesTab } from './client-deadlines-tab';
import { ClientDocumentsTab } from './client-documents-tab';
import { ClientLocationsTab } from './client-locations-tab';
import { ClientNotesTab } from './client-notes-tab';
import { ClientOrgChartTab } from './client-org-chart-tab';
import { ClientOverviewTab } from './client-overview-tab';
import type { DocumentListItem } from '@/features/documents/queries/get-documents';
import { ManageDocumentSheet } from '@/features/documents/components/manage-document-sheet';
import {
  ManageTaskSheet,
} from '@/features/clients/components/client-workspace-controls';
import {
  buildAggregatedDeadlines,
  buildAuditOptions,
  buildLocationNameMap,
  buildLocationOptions,
  buildClientWorkspaceOverview,
  buildClientWorkspaceServiceCoverage,
  buildServiceLineOptions,
  type ClientWorkspaceAuditItem,
} from '@/features/clients/lib/client-workspace-view';
import type {
  ClientContactRecord,
  ClientContractRecord,
  ClientDeadlineRecord,
  ClientManualDeadlineRecord,
  ClientNoteRecord,
  ClientServiceLineRecord,
  ClientTaskRecord,
} from '@/features/clients/queries/get-client-workspace';

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
  audits: ClientWorkspaceAuditItem[];
  client: ClientDetail;
  clientOptions: ClientOption[];
  contacts: ClientContactRecord[];
  contract: ClientContractRecord | null;
  deadlines: ClientDeadlineRecord[];
  documents: DocumentListItem[];
  manualDeadlines: ClientManualDeadlineRecord[];
  missingWorkspaceTables: string[];
  notes: ClientNoteRecord[];
  openNcCount: number;
  personnel: PersonnelListItem[];
  serviceLines: ClientServiceLineRecord[];
  tasks: ClientTaskRecord[];
  timelineEvents: AuditTimelineEvent[];
}

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

export function ClientDetailWorkspace({
  audits,
  client,
  clientOptions,
  contacts,
  contract,
  deadlines,
  documents,
  manualDeadlines,
  missingWorkspaceTables,
  notes,
  openNcCount,
  personnel,
  serviceLines,
  tasks,
  timelineEvents,
}: ClientDetailWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ClientTab>('overview');
  const [showClientProfileEditor, setShowClientProfileEditor] = useState(false);
  const isClientActive = client.is_active ?? true;
  const locationMap = useMemo(() => buildLocationNameMap(client.locations), [client.locations]);
  const locationOptions = useMemo(() => buildLocationOptions(client.locations), [client.locations]);
  const auditOptions = useMemo(() => buildAuditOptions(audits), [audits]);
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);
  const contractAttentionLimit = useMemo(() => {
    const date = new Date(today);
    date.setDate(date.getDate() + 60);
    return date;
  }, [today]);

  const aggregatedDeadlines = useMemo(
    () =>
      buildAggregatedDeadlines({
        audits,
        clientId: client.id,
        contract,
        deadlines,
        documents,
        tasks,
        today,
      }),
    [audits, client.id, contract, deadlines, documents, tasks, today]
  );

  const {
    activeServiceLines,
    contractDocumentMismatches,
    documentExpiredCount,
    documentExpiringSoonCount,
    documentReviewQueue,
    hasTrackedServiceLines,
    healthAlerts,
    keyContacts,
    nextActions,
    openTasks,
    overviewStats,
    overdueDeadlines,
    riskLevel,
    upcomingDeadlines,
    unlinkedOpenManualDeadlinesCount,
    unlinkedOpenTasksCount,
  } = useMemo(
    () =>
      buildClientWorkspaceOverview({
        aggregatedDeadlines,
        contacts,
        contract,
        contractAttentionLimit,
        documents,
        manualDeadlines,
        openNcCount,
        serviceLines,
        tasks,
        today,
      }),
    [
      aggregatedDeadlines,
      contacts,
      contract,
      contractAttentionLimit,
      documents,
      manualDeadlines,
      openNcCount,
      serviceLines,
      tasks,
      today,
    ]
  );

  const serviceLineMap = useMemo(
    () => new Map(activeServiceLines.map((line) => [line.id, line.title])),
    [activeServiceLines]
  );
  const serviceLineOptions = useMemo(
    () => buildServiceLineOptions(activeServiceLines),
    [activeServiceLines]
  );
  const serviceCoverage = useMemo(
    () =>
      buildClientWorkspaceServiceCoverage({
        activeServiceLines,
        audits,
        client,
        deadlines,
        documents,
        tasks,
        today,
      }),
    [activeServiceLines, audits, client, deadlines, documents, tasks, today]
  );

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
              Workspace operativo del cliente: alert, backlog e accesso rapido ai processi chiave.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ClientStateToggleButton clientId={client.id} isActive={isClientActive} />
          <ManageTaskSheet
            audits={auditOptions}
            clientId={client.id}
            locations={locationOptions}
            serviceLines={serviceLineOptions}
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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat) => (
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
            <ClientOverviewTab
              aggregatedDeadlines={aggregatedDeadlines}
              client={client}
              contract={contract}
              healthAlerts={healthAlerts}
              hasTrackedServiceLines={hasTrackedServiceLines}
              isClientActive={isClientActive}
              keyContacts={keyContacts}
              nextActions={nextActions}
              onOpenActivities={() => setActiveTab('activities')}
              onOpenContract={() => setActiveTab('contract')}
              onOpenDeadlines={() => setActiveTab('deadlines')}
              onOpenLocations={() => setActiveTab('locations')}
              onOpenOrgChart={() => setActiveTab('org-chart')}
              onToggleClientProfileEditor={() =>
                setShowClientProfileEditor((current) => !current)
              }
              serviceCoverage={serviceCoverage}
              showClientProfileEditor={showClientProfileEditor}
              unlinkedOpenManualDeadlinesCount={unlinkedOpenManualDeadlinesCount}
              unlinkedOpenTasksCount={unlinkedOpenTasksCount}
            />
          ) : null}

          {activeTab === 'activities' ? (
            <ClientActivitiesTab
              auditOptions={auditOptions}
              clientId={client.id}
              clientOptions={clientOptions}
              documents={documents}
              locationMap={locationMap}
              locations={locationOptions}
              onOpenDocuments={() => setActiveTab('documents')}
              personnel={personnel}
              serviceCoverage={serviceCoverage}
              serviceLineMap={serviceLineMap}
              serviceLineOptions={serviceLineOptions}
              serviceLines={activeServiceLines}
              tasks={tasks}
            />
          ) : null}

          {activeTab === 'contract' ? (
            <ClientContractTab
              clientId={client.id}
              contract={contract}
              contractDocumentMismatches={contractDocumentMismatches}
              documents={documents}
              onOpenDocuments={() => setActiveTab('documents')}
            />
          ) : null}

          {activeTab === 'org-chart' ? (
            <ClientOrgChartTab
              clientId={client.id}
              clientOptions={clientOptions}
              contacts={contacts}
              locationMap={locationMap}
              locations={locationOptions}
              personnel={personnel}
            />
          ) : null}

          {activeTab === 'locations' ? (
            <ClientLocationsTab
              aggregatedDeadlines={aggregatedDeadlines}
              audits={audits}
              client={client}
              contacts={contacts}
              documents={documents}
              openTasks={openTasks}
            />
          ) : null}

          {activeTab === 'audits' ? (
            <ClientAuditsTab
              audits={audits}
              clientId={client.id}
              openNcCount={openNcCount}
              timelineEvents={timelineEvents}
            />
          ) : null}

          {activeTab === 'documents' ? (
            <ClientDocumentsTab
              clientId={client.id}
              clientOptions={clientOptions}
              contractDocumentMismatches={contractDocumentMismatches}
              documentExpiredCount={documentExpiredCount}
              documentExpiringSoonCount={documentExpiringSoonCount}
              documentReviewQueue={documentReviewQueue}
              documents={documents}
              personnel={personnel}
            />
          ) : null}

          {activeTab === 'deadlines' ? (
            <ClientDeadlinesTab
              aggregatedDeadlines={aggregatedDeadlines}
              clientId={client.id}
              deadlines={deadlines}
              locationMap={locationMap}
              locations={locationOptions}
              manualDeadlines={manualDeadlines}
              overdueDeadlines={overdueDeadlines}
              serviceLineMap={serviceLineMap}
              serviceLineOptions={serviceLineOptions}
              upcomingDeadlines={upcomingDeadlines}
            />
          ) : null}

          {activeTab === 'notes' ? (
            <ClientNotesTab
              clientId={client.id}
              deadlines={deadlines}
              documents={documents}
              locationMap={locationMap}
              locations={locationOptions}
              notes={notes}
              tasks={tasks}
              timelineEvents={timelineEvents}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
