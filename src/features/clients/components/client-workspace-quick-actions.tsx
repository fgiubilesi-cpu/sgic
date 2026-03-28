'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  setClientDeadlineServiceLine,
  setClientNotePinned,
  setClientTaskServiceLine,
  setClientTaskStatus,
} from '@/features/clients/actions/client-workspace-actions';
import {
  filterServiceLinesForScope,
  getTaskStatusAction,
  normalizeSelectValue,
  type ServiceLineOption,
} from '@/features/clients/lib/client-workspace-controls';
import type {
  ClientNoteRecord,
  ClientTaskStatus,
} from '@/features/clients/queries/get-client-workspace';

export function TaskStatusQuickAction({
  clientId,
  status,
  taskId,
}: {
  clientId: string;
  status: ClientTaskStatus;
  taskId: string;
}) {
  const [pending, startTransition] = useTransition();
  const { label, nextStatus } = useMemo(() => getTaskStatusAction(status), [status]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        startTransition(async () => {
          const result = await setClientTaskStatus(taskId, clientId, nextStatus);
          if (!result.success) {
            toast.error(result.error ?? 'Impossibile aggiornare stato attività');
            return;
          }
          toast.success('Stato attività aggiornato');
        })
      }
      disabled={pending}
    >
      {label}
    </Button>
  );
}

function ServiceLineQuickAction({
  clientId,
  deadlineId,
  locationId,
  serviceLineId,
  serviceLines,
  taskId,
}: {
  clientId: string;
  deadlineId?: string;
  locationId: string | null;
  serviceLineId: string | null;
  serviceLines: ServiceLineOption[];
  taskId?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(serviceLineId ?? '');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setValue(serviceLineId ?? '');
    }, 0);

    return () => window.clearTimeout(timer);
  }, [serviceLineId]);

  const availableServiceLines = useMemo(() => {
    const scoped = filterServiceLinesForScope(serviceLines, locationId);
    if (!serviceLineId) return scoped;
    if (scoped.some((serviceLine) => serviceLine.id === serviceLineId)) return scoped;
    const current = serviceLines.find((serviceLine) => serviceLine.id === serviceLineId);
    return current ? [current, ...scoped] : scoped;
  }, [locationId, serviceLineId, serviceLines]);

  return (
    <select
      className="h-8 min-w-44 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700"
      value={value || 'none'}
      disabled={pending}
      onChange={(event) => {
        const nextValue = normalizeSelectValue(event.target.value);
        const previousValue = value;
        if (nextValue === previousValue) return;
        setValue(nextValue);

        startTransition(async () => {
          const result = taskId
            ? await setClientTaskServiceLine(taskId, clientId, nextValue || null)
            : await setClientDeadlineServiceLine(deadlineId!, clientId, nextValue || null);

          if (!result.success) {
            setValue(previousValue);
            toast.error(result.error ?? 'Impossibile aggiornare linea servizio');
            return;
          }

          toast.success(nextValue ? 'Linea servizio collegata' : 'Collegamento rimosso');
        });
      }}
    >
      <option value="none">Nessuna linea</option>
      {availableServiceLines.map((serviceLine) => (
        <option key={serviceLine.id} value={serviceLine.id}>
          {serviceLine.title}
        </option>
      ))}
    </select>
  );
}

export function TaskServiceLineQuickAction({
  clientId,
  locationId,
  serviceLineId,
  serviceLines,
  taskId,
}: {
  clientId: string;
  locationId: string | null;
  serviceLineId: string | null;
  serviceLines: ServiceLineOption[];
  taskId: string;
}) {
  return (
    <ServiceLineQuickAction
      clientId={clientId}
      locationId={locationId}
      serviceLineId={serviceLineId}
      serviceLines={serviceLines}
      taskId={taskId}
    />
  );
}

export function DeadlineServiceLineQuickAction({
  clientId,
  deadlineId,
  locationId,
  serviceLineId,
  serviceLines,
}: {
  clientId: string;
  deadlineId: string;
  locationId: string | null;
  serviceLineId: string | null;
  serviceLines: ServiceLineOption[];
}) {
  return (
    <ServiceLineQuickAction
      clientId={clientId}
      deadlineId={deadlineId}
      locationId={locationId}
      serviceLineId={serviceLineId}
      serviceLines={serviceLines}
    />
  );
}

export function NotePinAction({
  clientId,
  note,
}: {
  clientId: string;
  note: Pick<ClientNoteRecord, 'id' | 'pinned'>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await setClientNotePinned(note.id, clientId, !note.pinned);
          if (!result.success) {
            toast.error(result.error ?? 'Impossibile aggiornare evidenza nota');
            return;
          }
          toast.success(note.pinned ? 'Nota rimossa dai pin' : 'Nota fissata in alto');
        })
      }
    >
      {note.pinned ? 'Rimuovi pin' : 'Fissa'}
    </Button>
  );
}
