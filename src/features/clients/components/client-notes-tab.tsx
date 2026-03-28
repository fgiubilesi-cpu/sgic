'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ClientActivityTimelineCard } from '@/features/clients/components/client-activity-timeline-card';
import {
  ManageNoteSheet,
  NotePinAction,
} from '@/features/clients/components/client-workspace-controls';
import {
  buildClientWorkspaceActivityTimeline,
  toDateLabel,
} from '@/features/clients/lib/client-workspace-view';
import type { AuditTimelineEvent } from '@/features/audits/queries/get-audit-timeline';
import type { ClientDeadlineRecord, ClientNoteRecord, ClientTaskRecord } from '@/features/clients/queries/get-client-workspace';
import type { DocumentListItem } from '@/features/documents/queries/get-documents';

interface ClientNotesTabProps {
  clientId: string;
  deadlines: ClientDeadlineRecord[];
  documents: DocumentListItem[];
  locationMap: Map<string, string>;
  locations: Array<{ id: string; name: string }>;
  notes: ClientNoteRecord[];
  tasks: ClientTaskRecord[];
  timelineEvents: AuditTimelineEvent[];
}

export function ClientNotesTab({
  clientId,
  deadlines,
  documents,
  locationMap,
  locations,
  notes,
  tasks,
  timelineEvents,
}: ClientNotesTabProps) {
  const [noteType, setNoteType] = useState<'all' | ClientNoteRecord['note_type']>('all');

  const filteredNotes = useMemo(
    () => notes.filter((note) => noteType === 'all' || note.note_type === noteType),
    [noteType, notes]
  );

  const activityTimeline = useMemo(
    () =>
      buildClientWorkspaceActivityTimeline({
        deadlines,
        documents,
        locationMap,
        notes,
        tasks,
        timelineEvents,
      }),
    [deadlines, documents, locationMap, notes, tasks, timelineEvents]
  );

  return (
    <div className="space-y-4">
      <ClientActivityTimelineCard events={activityTimeline} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Note operative ({notes.length})</CardTitle>
            <CardDescription>
              Timeline interna di warning, decisioni e appunti contestuali.
            </CardDescription>
          </div>
          <ManageNoteSheet clientId={clientId} locations={locations} />
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
                      <NotePinAction clientId={clientId} note={note} />
                      <ManageNoteSheet clientId={clientId} locations={locations} note={note} />
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
  );
}
