'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertTriangle, CalendarRange, CalendarClock, CircleSlash, Link2, Repeat2, Siren } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type {
  DailyExecutionFocus,
  DailyExecutionItem,
  DailyExecutionOverview,
} from '@/features/clients/queries/get-daily-execution-overview';

interface DailyExecutionCockpitProps {
  overview: DailyExecutionOverview;
}

function toDateLabel(value: string | null) {
  if (!value) return 'Senza data';
  return new Date(value).toLocaleDateString('it-IT');
}

function priorityClass(priority: DailyExecutionItem['priority']) {
  if (priority === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (priority === 'high') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (priority === 'medium') return 'border-sky-200 bg-sky-50 text-sky-700';
  return 'border-zinc-200 bg-zinc-50 text-zinc-600';
}

export function DailyExecutionCockpit({ overview }: DailyExecutionCockpitProps) {
  const [focus, setFocus] = useState<DailyExecutionFocus>('today');
  const [clientFilter, setClientFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | DailyExecutionItem['priority']>('all');

  const focusItems = useMemo(() => {
    if (focus === 'critical') return overview.criticalItems;
    if (focus === 'overdue') return overview.overdueItems;
    if (focus === 'blocked') return overview.blockedItems;
    if (focus === 'recurring') return overview.recurringItems;
    if (focus === 'this_week') return overview.thisWeekItems;
    return overview.todayItems;
  }, [
    focus,
    overview.blockedItems,
    overview.criticalItems,
    overview.overdueItems,
    overview.recurringItems,
    overview.thisWeekItems,
    overview.todayItems,
  ]);

  const allItems = useMemo(
    () => [
      ...overview.todayItems,
      ...overview.thisWeekItems,
      ...overview.criticalItems,
      ...overview.overdueItems,
      ...overview.blockedItems,
      ...overview.recurringItems,
    ],
    [
      overview.blockedItems,
      overview.criticalItems,
      overview.overdueItems,
      overview.recurringItems,
      overview.thisWeekItems,
      overview.todayItems,
    ]
  );

  const clientOptions = useMemo(
    () =>
      Array.from(new Map(allItems.map((item) => [item.client_id, item.client_name])).entries()).sort(
        (left, right) => left[1].localeCompare(right[1], 'it')
      ),
    [allItems]
  );

  const ownerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allItems
            .map((item) => item.owner_name)
            .filter((owner): owner is string => Boolean(owner))
        )
      ).sort((left, right) => left.localeCompare(right, 'it')),
    [allItems]
  );

  const locationOptions = useMemo(
    () =>
      Array.from(
        new Map(
          allItems
            .filter((item) => item.location_id && item.location_name)
            .map((item) => [item.location_id as string, item.location_name as string])
        ).entries()
      ).sort((left, right) => left[1].localeCompare(right[1], 'it')),
    [allItems]
  );

  const items = useMemo(
    () =>
      focusItems.filter((item) => {
        if (clientFilter !== 'all' && item.client_id !== clientFilter) return false;
        if (locationFilter === 'none') {
          if (item.location_id) return false;
        } else if (locationFilter !== 'all' && item.location_id !== locationFilter) {
          return false;
        }
        if (ownerFilter === 'unassigned' && item.owner_name) return false;
        if (ownerFilter !== 'all' && ownerFilter !== 'unassigned' && item.owner_name !== ownerFilter) {
          return false;
        }
        if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;
        return true;
      }),
    [clientFilter, focusItems, locationFilter, ownerFilter, priorityFilter]
  );

  const activeFilterCount =
    (clientFilter !== 'all' ? 1 : 0) +
    (locationFilter !== 'all' ? 1 : 0) +
    (ownerFilter !== 'all' ? 1 : 0) +
    (priorityFilter !== 'all' ? 1 : 0);

  const title =
    focus === 'critical'
      ? 'Backlog critico'
      : focus === 'overdue'
      ? 'Lavoro in ritardo'
      : focus === 'blocked'
        ? 'Attività bloccate'
        : focus === 'recurring'
          ? 'Ricorrenti da riallineare'
        : focus === 'this_week'
          ? 'Lavoro di questa settimana'
        : 'Lavoro di oggi';
  const description =
    focus === 'critical'
      ? 'Elementi che combinano ritardo, blocco, priorità alta o buchi operativi.'
      : focus === 'overdue'
      ? 'Task e scadenze aperte oltre termine.'
      : focus === 'blocked'
        ? 'Task ferme che richiedono sblocco o riallineamento.'
        : focus === 'recurring'
          ? 'Task ricorrenti senza prossima data o fuori ritmo.'
        : focus === 'this_week'
          ? 'Task e scadenze pianificate entro la fine della settimana.'
        : 'Task e scadenze che richiedono attenzione entro oggi.';

  return (
    <Card className="border-zinc-200 bg-white shadow-sm">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>Daily execution cockpit</CardTitle>
          <CardDescription>
            Vista cross-cliente per capire subito cosa va mosso oggi.
          </CardDescription>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <button
            type="button"
            onClick={() => setFocus('critical')}
            className={
              focus === 'critical'
                ? 'rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-left'
                : 'rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left'
            }
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <Siren className="h-4 w-4" />
              Critico
            </div>
            <div className="mt-2 text-2xl font-semibold text-zinc-900">
              {overview.summary.critical}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFocus('today')}
            className={
              focus === 'today'
                ? 'rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-left'
                : 'rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left'
            }
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <CalendarClock className="h-4 w-4" />
              Oggi
            </div>
            <div className="mt-2 text-2xl font-semibold text-zinc-900">{overview.summary.today}</div>
          </button>
          <button
            type="button"
            onClick={() => setFocus('this_week')}
            className={
              focus === 'this_week'
                ? 'rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-left'
                : 'rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left'
            }
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <CalendarRange className="h-4 w-4" />
              Questa settimana
            </div>
            <div className="mt-2 text-2xl font-semibold text-zinc-900">
              {overview.summary.this_week}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFocus('recurring')}
            className={
              focus === 'recurring'
                ? 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-left'
                : 'rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left'
            }
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <Repeat2 className="h-4 w-4" />
              Ricorrenti
            </div>
            <div className="mt-2 text-2xl font-semibold text-zinc-900">
              {overview.summary.recurring}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFocus('overdue')}
            className={
              focus === 'overdue'
                ? 'rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-left'
                : 'rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left'
            }
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <AlertTriangle className="h-4 w-4" />
              In ritardo
            </div>
            <div className="mt-2 text-2xl font-semibold text-zinc-900">
              {overview.summary.overdue}
            </div>
          </button>
          <button
            type="button"
            onClick={() => setFocus('blocked')}
            className={
              focus === 'blocked'
                ? 'rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left'
                : 'rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-left'
            }
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-zinc-500">
              <CircleSlash className="h-4 w-4" />
              Bloccate
            </div>
            <div className="mt-2 text-2xl font-semibold text-zinc-900">
              {overview.summary.blocked}
            </div>
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium text-zinc-900">{title}</p>
          <p className="text-sm text-zinc-500">{description}</p>
          {focus === 'critical' ? (
            <p className="mt-1 text-xs text-zinc-500">
              Regole correnti: entrano nel backlog critico elementi bloccati, in ritardo o con
              punteggio alto dato da priorità, assenza di linea servizio, assenza owner e ricorrenze
              fuori cadenza.
            </p>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i clienti</SelectItem>
              {clientOptions.map(([clientId, clientName]) => (
                <SelectItem key={clientId} value={clientId}>
                  {clientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Sede" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le sedi</SelectItem>
              <SelectItem value="none">Senza sede</SelectItem>
              {locationOptions.map(([locationId, locationName]) => (
                <SelectItem key={locationId} value={locationId}>
                  {locationName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli owner</SelectItem>
              <SelectItem value="unassigned">Senza owner</SelectItem>
              {ownerOptions.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={priorityFilter}
            onValueChange={(value) => setPriorityFilter(value as 'all' | DailyExecutionItem['priority'])}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priorità" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le priorità</SelectItem>
              <SelectItem value="critical">Critica</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Media</SelectItem>
              <SelectItem value="low">Bassa</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center justify-end gap-2 text-sm text-zinc-500">
            {activeFilterCount > 0 ? (
              <Badge variant="secondary" className="bg-zinc-100 text-zinc-700">
                {activeFilterCount} filtri attivi
              </Badge>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setClientFilter('all');
                setLocationFilter('all');
                setOwnerFilter('all');
                setPriorityFilter('all');
              }}
              disabled={activeFilterCount === 0}
            >
              Reset
            </Button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-6 text-sm text-zinc-600">
            Nessun elemento in questa vista. Il cockpit si popolerà man mano che task e scadenze
            richiedono attenzione.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 lg:flex-row lg:items-start lg:justify-between"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-zinc-900">{item.title}</p>
                  <Badge variant="outline" className={priorityClass(item.priority)}>
                    {item.priority}
                  </Badge>
                  {focus === 'critical' ? (
                    <Badge variant="outline" className="border-rose-200 bg-rose-50 text-rose-700">
                      Score {item.critical_score}
                    </Badge>
                  ) : null}
                  <Badge variant="outline" className="border-zinc-200 bg-white text-zinc-600">
                    {item.source_label}
                  </Badge>
                  {!item.has_service_link ? (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                      Senza linea servizio
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-zinc-600">
                  {item.client_name} · {item.status_label} · {toDateLabel(item.due_date)}
                  {item.location_name ? ` · ${item.location_name}` : ''}
                  {item.owner_name ? ` · ${item.owner_name}` : ''}
                </p>
                {item.is_recurring && item.recurrence_label ? (
                  <p className="text-xs text-zinc-500">Ricorrenza: {item.recurrence_label}</p>
                ) : null}
                {focus === 'critical' && item.critical_reasons.length > 0 ? (
                  <p className="text-xs text-rose-700">
                    {item.critical_reasons.join(' · ')}
                  </p>
                ) : null}
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={item.href}>
                  <Link2 className="mr-2 h-3.5 w-3.5" />
                  Apri cliente
                </Link>
              </Button>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
