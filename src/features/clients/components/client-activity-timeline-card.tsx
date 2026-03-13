'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUpRight, CalendarClock, FileText, NotebookPen, ShieldCheck, SquareCheckBig } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type {
  ClientActivityTimelineItem,
  ClientActivityTimelineKind,
} from '@/features/clients/lib/client-activity-timeline';

interface ClientActivityTimelineCardProps {
  events: ClientActivityTimelineItem[];
}

function toDateLabel(value: string | null) {
  if (!value) return 'Data non disponibile';
  return new Date(value).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function kindLabel(kind: ClientActivityTimelineKind) {
  if (kind === 'audit') return 'Audit';
  if (kind === 'task') return 'Task';
  if (kind === 'deadline') return 'Scadenza';
  if (kind === 'document') return 'Documento';
  return 'Nota';
}

function kindIcon(kind: ClientActivityTimelineKind) {
  if (kind === 'audit') return ShieldCheck;
  if (kind === 'task') return SquareCheckBig;
  if (kind === 'deadline') return CalendarClock;
  if (kind === 'document') return FileText;
  return NotebookPen;
}

function kindClassName(kind: ClientActivityTimelineKind) {
  if (kind === 'audit') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (kind === 'task') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (kind === 'deadline') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (kind === 'document') return 'border-violet-200 bg-violet-50 text-violet-700';
  return 'border-zinc-200 bg-zinc-50 text-zinc-700';
}

export function ClientActivityTimelineCard({ events }: ClientActivityTimelineCardProps) {
  const [kindFilter, setKindFilter] = useState<'all' | ClientActivityTimelineKind>('all');

  const filteredEvents = useMemo(
    () =>
      events
        .filter((event) => kindFilter === 'all' || event.kind === kindFilter)
        .slice(0, 12),
    [events, kindFilter]
  );

  const filters: Array<{ id: 'all' | ClientActivityTimelineKind; label: string }> = [
    { id: 'all', label: 'Tutti' },
    { id: 'audit', label: 'Audit' },
    { id: 'task', label: 'Task' },
    { id: 'deadline', label: 'Scadenze' },
    { id: 'document', label: 'Documenti' },
    { id: 'note', label: 'Note' },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>Timeline cliente</CardTitle>
          <CardDescription>
            Feed unico di audit, task, scadenze, documenti e note per leggere il cliente in
            continuità.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setKindFilter(filter.id)}
              className={
                kindFilter === filter.id
                  ? 'rounded-full border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white'
                  : 'rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100'
              }
            >
              {filter.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-600">
            Nessun evento coerente con il filtro selezionato.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              const Icon = kindIcon(event.kind);

              return (
                <div
                  key={event.id}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={kindClassName(event.kind)}>
                        <Icon className="mr-1 h-3.5 w-3.5" />
                        {kindLabel(event.kind)}
                      </Badge>
                      <span className="text-xs text-zinc-500">{toDateLabel(event.date)}</span>
                      {event.locationName ? (
                        <Badge variant="outline" className="border-zinc-200 bg-white text-zinc-600">
                          {event.locationName}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="font-medium text-zinc-900">{event.title}</p>
                    {event.description ? (
                      <p className="text-sm text-zinc-600">{event.description}</p>
                    ) : null}
                  </div>
                  {event.href ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={event.href} target={event.kind === 'document' ? '_blank' : undefined}>
                        <ArrowUpRight className="mr-2 h-3.5 w-3.5" />
                        Apri
                      </Link>
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
