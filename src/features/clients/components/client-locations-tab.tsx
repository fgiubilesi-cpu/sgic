'use client';

import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ManageLocationSheet } from '@/features/clients/components/manage-location-sheet';
import { LocationStateToggleButton } from '@/features/clients/components/location-state-toggle-button';
import {
  buildLocationInsights,
  toDateLabel,
  type AggregatedDeadline,
  type ClientWorkspaceAuditItem,
} from '@/features/clients/lib/client-workspace-view';
import type { ClientDetail } from '@/features/clients/queries/get-client';
import type {
  ClientContactRecord,
  ClientTaskRecord,
} from '@/features/clients/queries/get-client-workspace';
import type { DocumentListItem } from '@/features/documents/queries/get-documents';

interface ClientLocationsTabProps {
  aggregatedDeadlines: AggregatedDeadline[];
  audits: ClientWorkspaceAuditItem[];
  client: ClientDetail;
  contacts: ClientContactRecord[];
  documents: DocumentListItem[];
  openTasks: ClientTaskRecord[];
}

export function ClientLocationsTab({
  aggregatedDeadlines,
  audits,
  client,
  contacts,
  documents,
  openTasks,
}: ClientLocationsTabProps) {
  const locationInsights = useMemo(
    () =>
      buildLocationInsights({
        aggregatedDeadlines,
        audits,
        client,
        contacts,
        documents,
        openTasks,
      }),
    [aggregatedDeadlines, audits, client, contacts, documents, openTasks]
  );

  return (
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
                    Task aperte: <span className="font-semibold text-zinc-900">{item.tasks}</span>
                  </div>
                  <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                    Documenti:{' '}
                    <span className="font-semibold text-zinc-900">{item.documents}</span>
                  </div>
                  <div className="rounded-md bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
                    Prossima scadenza:{' '}
                    <span className="font-semibold text-zinc-900">
                      {toDateLabel(item.nextDeadline)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
