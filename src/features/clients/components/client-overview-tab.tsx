'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ClientForm } from '@/features/clients/components/client-form';
import { ClientOperationalHygieneCard } from '@/features/clients/components/client-operational-hygiene-card';
import { ClientServiceCoverageCard } from '@/features/clients/components/client-service-coverage-card';
import type { ClientServiceCoverageSnapshot } from '@/features/clients/lib/client-service-coverage';
import {
  priorityBadgeClass,
  priorityLabel,
  sourceTypeLabel,
  toDateLabel,
  type AggregatedDeadline,
} from '@/features/clients/lib/client-workspace-view';
import type { ClientDetail } from '@/features/clients/queries/get-client';
import type {
  ClientContactRecord,
  ClientContractRecord,
  ClientTaskRecord,
} from '@/features/clients/queries/get-client-workspace';

interface ClientOverviewTabProps {
  aggregatedDeadlines: AggregatedDeadline[];
  client: ClientDetail;
  contract: ClientContractRecord | null;
  healthAlerts: string[];
  hasTrackedServiceLines: boolean;
  isClientActive: boolean;
  keyContacts: ClientContactRecord[];
  nextActions: ClientTaskRecord[];
  onOpenActivities: () => void;
  onOpenContract: () => void;
  onOpenDeadlines: () => void;
  onOpenLocations: () => void;
  onOpenOrgChart: () => void;
  onToggleClientProfileEditor: () => void;
  serviceCoverage: ClientServiceCoverageSnapshot;
  showClientProfileEditor: boolean;
  unlinkedOpenManualDeadlinesCount: number;
  unlinkedOpenTasksCount: number;
}

export function ClientOverviewTab({
  aggregatedDeadlines,
  client,
  contract,
  healthAlerts,
  hasTrackedServiceLines,
  isClientActive,
  keyContacts,
  nextActions,
  onOpenActivities,
  onOpenContract,
  onOpenDeadlines,
  onOpenLocations,
  onOpenOrgChart,
  onToggleClientProfileEditor,
  serviceCoverage,
  showClientProfileEditor,
  unlinkedOpenManualDeadlinesCount,
  unlinkedOpenTasksCount,
}: ClientOverviewTabProps) {
  const openDeadlinePreview = aggregatedDeadlines
    .filter((deadline) => deadline.status === 'open')
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Alert operativi</CardTitle>
            <CardDescription>
              Solo i segnali che richiedono attenzione o decisione a breve.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {healthAlerts.length === 0 ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                Nessuna criticità immediata: il cliente è sotto controllo operativo.
              </div>
            ) : (
              healthAlerts.map((alert) => (
                <div
                  key={alert}
                  className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-700"
                >
                  {alert}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prossime attività</CardTitle>
            <CardDescription>
              Backlog operativo ordinato per urgenza e priorità.
            </CardDescription>
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
                        {task.owner_name || 'Assegnatario da definire'} · scadenza{' '}
                        {toDateLabel(task.due_date)}
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

      <ClientServiceCoverageCard
        coverage={serviceCoverage}
        onOpenActivities={onOpenActivities}
        onOpenDeadlines={onOpenDeadlines}
      />

      <ClientOperationalHygieneCard
        hasTrackedServiceLines={hasTrackedServiceLines}
        onOpenActivities={onOpenActivities}
        onOpenContract={onOpenContract}
        onOpenDeadlines={onOpenDeadlines}
        unlinkedOpenManualDeadlinesCount={unlinkedOpenManualDeadlinesCount}
        unlinkedOpenTasksCount={unlinkedOpenTasksCount}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Prossime scadenze</CardTitle>
            <CardDescription>
              Vista unificata su contratto, task, audit, documenti e manuali.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {openDeadlinePreview.length === 0 ? (
              <p className="text-sm text-zinc-500">Nessuna scadenza aperta.</p>
            ) : (
              openDeadlinePreview.map((deadline) => (
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
            <CardDescription>
              Referenti essenziali per sbloccare attività e decisioni.
            </CardDescription>
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
                  <p className="text-xs text-zinc-500">{contact.email || 'Email n.d.'}</p>
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
              <p className="font-medium text-zinc-900">
                {contract?.contract_type ?? 'Non configurato'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Stato</p>
              <p className="font-medium text-zinc-900">{contract?.status ?? 'Non impostato'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Scadenza</p>
              <p className="font-medium text-zinc-900">{toDateLabel(contract?.end_date)}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={onOpenContract}>
              Gestisci contratto
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Anagrafica cliente</CardTitle>
          <CardDescription>
            Sintesi rapida; l’editing completo resta opzionale.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Partita IVA</p>
              <p className="text-sm font-medium text-zinc-900">
                {client.vat_number || 'Non disponibile'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Email</p>
              <p className="text-sm font-medium text-zinc-900">
                {client.email || 'Non disponibile'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Telefono</p>
              <p className="text-sm font-medium text-zinc-900">
                {client.phone || 'Non disponibile'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Stato cliente</p>
              <p className="text-sm font-medium text-zinc-900">
                {isClientActive ? 'Attivo' : 'Archiviato'}
              </p>
            </div>
          </div>
          {client.notes ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Note base</p>
              <p className="mt-1 text-sm text-zinc-700">{client.notes}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={onToggleClientProfileEditor}>
              {showClientProfileEditor
                ? 'Nascondi modifica anagrafica'
                : 'Modifica anagrafica'}
            </Button>
            <Button variant="outline" onClick={onOpenLocations}>
              Apri sedi
            </Button>
            <Button variant="outline" onClick={onOpenOrgChart}>
              Apri referenti
            </Button>
          </div>
          {showClientProfileEditor ? (
            <div className="border-t border-zinc-200 pt-4">
              <ClientForm client={client} />
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
