'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DocumentIntakeReviewSheet } from '@/features/documents/components/document-intake-review-sheet';
import { ManageDocumentSheet } from '@/features/documents/components/manage-document-sheet';
import type { DocumentListItem } from '@/features/documents/queries/get-documents';
import {
  ManageTaskSheet,
  TaskServiceLineQuickAction,
  TaskStatusQuickAction,
} from '@/features/clients/components/client-workspace-controls';
import {
  getServiceCoverageStatusClassName,
  getServiceCoverageStatusLabel,
  type ClientServiceCoverageSnapshot,
} from '@/features/clients/lib/client-service-coverage';
import {
  isActivityPlanDocument,
  preferredDocumentAccessUrl,
  priorityBadgeClass,
  priorityLabel,
  serviceCoverageSecondaryLine,
  taskContextLabel,
  taskStatusBadgeClass,
  taskStatusLabel,
  toDateLabel,
} from '@/features/clients/lib/client-workspace-view';
import type { ClientOption } from '@/features/clients/queries/get-client-options';
import type {
  ClientServiceLineRecord,
  ClientTaskPriority,
  ClientTaskRecord,
  ClientTaskStatus,
} from '@/features/clients/queries/get-client-workspace';
import type { PersonnelListItem } from '@/features/personnel/queries/get-personnel';

interface ClientActivitiesTabProps {
  auditOptions: Array<{ id: string; title: string | null }>;
  clientId: string;
  clientOptions: ClientOption[];
  documents: DocumentListItem[];
  locationMap: Map<string, string>;
  locations: Array<{ id: string; name: string }>;
  onOpenDocuments: () => void;
  personnel: PersonnelListItem[];
  serviceCoverage: ClientServiceCoverageSnapshot;
  serviceLineMap: Map<string, string>;
  serviceLineOptions: Array<{ id: string; location_id: string | null; title: string }>;
  serviceLines: ClientServiceLineRecord[];
  tasks: ClientTaskRecord[];
}

export function ClientActivitiesTab({
  auditOptions,
  clientId,
  clientOptions,
  documents,
  locationMap,
  locations,
  onOpenDocuments,
  personnel,
  serviceCoverage,
  serviceLineMap,
  serviceLineOptions,
  serviceLines,
  tasks,
}: ClientActivitiesTabProps) {
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatus, setTaskStatus] = useState<'all' | ClientTaskStatus>('all');
  const [taskPriority, setTaskPriority] = useState<'all' | ClientTaskPriority>('all');

  const activeServiceLines = serviceLines;
  const latestActivityPlanDocument = useMemo(
    () => documents.find((document) => isActivityPlanDocument(document)) ?? null,
    [documents]
  );
  const serviceLineDocumentUrl = preferredDocumentAccessUrl(latestActivityPlanDocument);
  const serviceLineDocumentName = latestActivityPlanDocument?.title || 'Allegato attività';
  const serviceCoverageByLineId = useMemo(
    () => new Map(serviceCoverage.items.map((item) => [item.lineId, item])),
    [serviceCoverage.items]
  );
  const filteredTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const search = taskSearch.trim().toLowerCase();
        const matchesSearch =
          search === '' ||
          task.title.toLowerCase().includes(search) ||
          (task.description ?? '').toLowerCase().includes(search) ||
          (task.owner_name ?? '').toLowerCase().includes(search);
        const matchesStatus = taskStatus === 'all' || task.status === taskStatus;
        const matchesPriority = taskPriority === 'all' || task.priority === taskPriority;
        return matchesSearch && matchesStatus && matchesPriority;
      }),
    [taskPriority, taskSearch, taskStatus, tasks]
  );

  const openTaskCount = useMemo(
    () => tasks.filter((task) => task.status !== 'done').length,
    [tasks]
  );
  const coverageAttentionCount = serviceCoverage.summary.missing + serviceCoverage.summary.overdue;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Attività contrattuali ({activeServiceLines.length})</CardTitle>
            <CardDescription>
              Perimetro operativo importato da contratto o allegati attività, con focus sulle linee
              ancora da presidiare.
            </CardDescription>
          </div>
          <ManageDocumentSheet
            clientOptions={clientOptions}
            defaultClientId={clientId}
            personnelOptions={personnel}
            triggerLabel="Importa allegato attività"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {latestActivityPlanDocument ? (
            <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium text-zinc-900">Documento attività rilevato</p>
                  <p className="text-zinc-700">{serviceLineDocumentName}</p>
                  <p className="text-xs text-zinc-500">
                    Intake: {latestActivityPlanDocument.ingestion_status || 'manuale'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {serviceLineDocumentUrl ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={serviceLineDocumentUrl} target="_blank" rel="noreferrer">
                        Apri allegato
                      </a>
                    </Button>
                  ) : null}
                  <DocumentIntakeReviewSheet document={latestActivityPlanDocument} />
                  <Button type="button" variant="outline" size="sm" onClick={onOpenDocuments}>
                    Vai ai documenti
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-600">
              Nessun allegato attività collegato. Puoi caricare qui un PDF/Word con le azioni, i
              costi o il piano servizi e poi confermare la review per popolare automaticamente
              questa sezione.
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Righe attive</p>
              <p className="mt-2 text-3xl font-semibold text-zinc-900">{activeServiceLines.length}</p>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Da presidiare</p>
              <p className="mt-2 text-3xl font-semibold text-rose-700">{coverageAttentionCount}</p>
            </div>
          </div>

          {serviceCoverage.summary.total > 0 ? (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              <span className="font-medium text-zinc-900">
                {serviceCoverage.summary.guarded}/{serviceCoverage.summary.total}
              </span>{' '}
              linee risultano presidiate o già pianificate.
              {coverageAttentionCount > 0 ? (
                <span className="text-rose-700">
                  {' '}
                  {coverageAttentionCount} sono scoperte o in ritardo.
                </span>
              ) : null}
            </div>
          ) : null}

          {activeServiceLines.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nessuna attività contrattuale importata. Dopo l’upload, apri la review del documento
              e applica le righe al workspace cliente.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attività</TableHead>
                  <TableHead>Ambito</TableHead>
                  <TableHead>Frequenza</TableHead>
                  <TableHead>Copertura</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeServiceLines.map((line) => {
                  const coverage = serviceCoverageByLineId.get(line.id);

                  return (
                    <TableRow key={line.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-zinc-900">{line.title}</p>
                          <p className="text-xs text-zinc-500">
                            {[line.code, line.section].filter(Boolean).join(' · ') ||
                              'Perimetro senza metadati'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {line.location_id
                          ? locationMap.get(line.location_id) ?? 'Sede rimossa'
                          : 'Cliente'}
                      </TableCell>
                      <TableCell>{line.frequency_label || '-'}</TableCell>
                      <TableCell>
                        {coverage ? (
                          <div className="space-y-1">
                            <Badge
                              variant="outline"
                              className={getServiceCoverageStatusClassName(coverage.status)}
                            >
                              {getServiceCoverageStatusLabel(coverage.status)}
                            </Badge>
                            <p className="text-xs text-zinc-500">
                              {serviceCoverageSecondaryLine(
                                coverage.nextPlannedAt,
                                coverage.lastEvidenceAt
                              )}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-500">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Task operative ({openTaskCount} aperte)</CardTitle>
            <CardDescription>
              Worklist interna filtrabile per stato e priorità, senza confondere backlog vivo e
              storico completato.
            </CardDescription>
          </div>
          <ManageTaskSheet
            audits={auditOptions}
            clientId={clientId}
            locations={locations}
            serviceLines={serviceLineOptions}
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

          {filteredTasks.length === 0 ? (
            <p className="text-sm text-zinc-500">Nessuna attività coerente con i filtri.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
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
                        <p className="text-xs text-zinc-500">
                          {task.owner_name || 'Assegnatario da definire'}
                          {task.description ? ` · ${task.description}` : ''}
                        </p>
                      </div>
                    </TableCell>
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
                        {taskContextLabel(task, locationMap, serviceLineMap)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1">
                        <TaskServiceLineQuickAction
                          clientId={clientId}
                          locationId={task.location_id}
                          serviceLineId={task.service_line_id}
                          serviceLines={serviceLineOptions}
                          taskId={task.id}
                        />
                        <TaskStatusQuickAction
                          clientId={clientId}
                          status={task.status}
                          taskId={task.id}
                        />
                        <ManageTaskSheet
                          audits={auditOptions}
                          clientId={clientId}
                          locations={locations}
                          serviceLines={serviceLineOptions}
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
    </div>
  );
}
