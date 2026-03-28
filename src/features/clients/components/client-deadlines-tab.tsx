'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DeadlineServiceLineQuickAction,
  ManageDeadlineSheet,
} from '@/features/clients/components/client-workspace-controls';
import {
  priorityBadgeClass,
  priorityLabel,
  sourceTypeBadgeClass,
  sourceTypeLabel,
  toDateLabel,
  toDateStart,
  type AggregatedDeadline,
} from '@/features/clients/lib/client-workspace-view';
import type {
  ClientDeadlineRecord,
  ClientManualDeadlineRecord,
} from '@/features/clients/queries/get-client-workspace';

interface ClientDeadlinesTabProps {
  aggregatedDeadlines: AggregatedDeadline[];
  clientId: string;
  deadlines: ClientDeadlineRecord[];
  locationMap: Map<string, string>;
  locations: Array<{ id: string; name: string }>;
  manualDeadlines: ClientManualDeadlineRecord[];
  overdueDeadlines: AggregatedDeadline[];
  serviceLineMap: Map<string, string>;
  serviceLineOptions: Array<{ id: string; location_id: string | null; title: string }>;
  upcomingDeadlines: AggregatedDeadline[];
}

export function ClientDeadlinesTab({
  aggregatedDeadlines,
  clientId,
  deadlines,
  locationMap,
  locations,
  manualDeadlines,
  overdueDeadlines,
  serviceLineMap,
  serviceLineOptions,
  upcomingDeadlines,
}: ClientDeadlinesTabProps) {
  const [deadlineSource, setDeadlineSource] =
    useState<'all' | AggregatedDeadline['source_type']>('all');
  const [deadlineStatus, setDeadlineStatus] =
    useState<'all' | AggregatedDeadline['status']>('all');
  const [deadlineUrgency, setDeadlineUrgency] = useState<'all' | 'overdue' | 'upcoming'>('all');

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const filteredDeadlines = useMemo(
    () =>
      aggregatedDeadlines.filter((deadline) => {
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
      }),
    [aggregatedDeadlines, deadlineSource, deadlineStatus, deadlineUrgency, today]
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
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
            clientId={clientId}
            locations={locations}
            serviceLines={serviceLineOptions}
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
                  setDeadlineSource(event.target.value as 'all' | AggregatedDeadline['source_type'])
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
                  const workspaceDeadline = deadlines.find((item) => item.id === deadline.id);

                  return (
                    <TableRow key={deadline.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-zinc-900">{deadline.title}</p>
                          <p className="text-xs text-zinc-500">{deadline.description || '-'}</p>
                          {deadline.service_line_id ? (
                            <p className="text-xs text-zinc-500">
                              Servizio:{' '}
                              {serviceLineMap.get(deadline.service_line_id) ?? 'Linea rimossa'}
                            </p>
                          ) : null}
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
                          {workspaceDeadline ? (
                            <DeadlineServiceLineQuickAction
                              clientId={clientId}
                              deadlineId={workspaceDeadline.id}
                              locationId={workspaceDeadline.location_id}
                              serviceLineId={workspaceDeadline.service_line_id}
                              serviceLines={serviceLineOptions}
                            />
                          ) : null}
                          {manualDeadline ? (
                            <ManageDeadlineSheet
                              clientId={clientId}
                              deadline={manualDeadline}
                              locations={locations}
                              serviceLines={serviceLineOptions}
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
  );
}
