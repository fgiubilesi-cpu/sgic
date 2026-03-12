'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { CloudOff, Download, RefreshCcw, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChecklistManager } from '@/features/audits/components/checklist-manager';
import { updateChecklistItem } from '@/features/audits/actions';
import type { NonConformity } from '@/features/audits/queries/get-non-conformities';
import type {
  AuditWithChecklists,
  ChecklistItem,
} from '@/features/audits/queries/get-audit';
import type { AuditOutcome } from '@/features/audits/schemas/audit-schema';
import {
  buildOfflineAuditRecord,
  getOfflineAuditRecord,
  saveOfflineAuditRecord,
} from '@/lib/offline/audit-cache';
import { db } from '@/lib/offline/db';
import { useSync } from '@/lib/offline/sync-provider';

interface PersistChecklistItemInput {
  itemId: string;
  notes?: string;
  outcome?: AuditOutcome;
}

interface AuditChecklistWorkspaceProps {
  audit: AuditWithChecklists;
  nonConformities: NonConformity[];
  readOnly?: boolean;
}

function isNetworkError(error: unknown) {
  if (!navigator.onLine) return true;
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return message.includes('network') || message.includes('fetch') || message.includes('offline');
}

function applyChecklistItemPatch(
  audit: AuditWithChecklists,
  itemId: string,
  patch: Partial<Pick<ChecklistItem, 'notes' | 'outcome'>>
) {
  return {
    ...audit,
    checklists: audit.checklists.map((checklist) => ({
      ...checklist,
      items: checklist.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...patch,
            }
          : item
      ),
    })),
  } satisfies AuditWithChecklists;
}

function collectNcItemIds(audit: AuditWithChecklists, nonConformities: NonConformity[]) {
  const ids = new Set(nonConformities.map((item) => item.checklistItemId));

  for (const checklist of audit.checklists) {
    for (const item of checklist.items) {
      if (item.outcome === 'non_compliant') ids.add(item.id);
    }
  }

  return Array.from(ids);
}

export function AuditChecklistWorkspace({
  audit,
  nonConformities,
  readOnly = false,
}: AuditChecklistWorkspaceProps) {
  const [workingAudit, setWorkingAudit] = useState(audit);
  const [offlineSavedAt, setOfflineSavedAt] = useState<number | null>(null);
  const [hydratedFromOffline, setHydratedFromOffline] = useState(false);
  const [loadingOfflineState, setLoadingOfflineState] = useState(true);
  const [preparingOffline, startPreparingOffline] = useTransition();
  const { enqueueMutation, isOnline } = useSync();
  const router = useRouter();

  const path = `/audits/${audit.id}`;
  const pendingAuditSyncCount =
    useLiveQuery(async () => {
      const items = await db.sync_queue.toArray();
      return items.filter(
        (item) =>
          (item.status === 'pending' || item.status === 'failed') &&
          item.payload?.auditId === audit.id
      ).length;
    }, [audit.id]) ?? 0;

  const activeNcItemIds = useMemo(
    () => collectNcItemIds(workingAudit, nonConformities),
    [nonConformities, workingAudit]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadOfflineState() {
      const record = await getOfflineAuditRecord(audit.id);
      if (cancelled) return;

      const shouldUseOfflineCopy = !navigator.onLine || pendingAuditSyncCount > 0;
      setOfflineSavedAt(record?.savedAt ?? null);
      setHydratedFromOffline(Boolean(record && shouldUseOfflineCopy));
      setWorkingAudit(record && shouldUseOfflineCopy ? record.audit : audit);
      setLoadingOfflineState(false);
    }

    loadOfflineState();

    return () => {
      cancelled = true;
    };
  }, [audit, audit.id, pendingAuditSyncCount]);

  useEffect(() => {
    const handleSyncComplete = (event: Event) => {
      const detail = (event as CustomEvent<{ auditId?: string | null }>).detail;
      if (detail?.auditId !== audit.id) return;
      router.refresh();
    };

    window.addEventListener('sgic-sync-complete', handleSyncComplete);
    return () => window.removeEventListener('sgic-sync-complete', handleSyncComplete);
  }, [audit.id, router]);

  const persistOfflineSnapshot = async (nextAudit: AuditWithChecklists) => {
    const nextSavedAt = Date.now();
    await saveOfflineAuditRecord(
      buildOfflineAuditRecord({
        audit: nextAudit,
        ncItemIds: collectNcItemIds(nextAudit, nonConformities),
        path,
      })
    );
    setOfflineSavedAt(nextSavedAt);
  };

  const prepareOffline = () => {
    startPreparingOffline(async () => {
      try {
        await persistOfflineSnapshot(workingAudit);

        router.prefetch(path);
        router.prefetch('/~offline');

        await Promise.all([
          fetch(path, { credentials: 'include' }).catch(() => undefined),
          fetch('/~offline', { credentials: 'include' }).catch(() => undefined),
        ]);

        toast.success('Checklist salvata offline. Potrai continuare a compilarla anche senza rete.');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Impossibile preparare la checklist offline.';
        toast.error(message);
      }
    });
  };

  const persistChecklistItem = async (input: PersistChecklistItemInput) => {
    const previousAudit = workingAudit;
    const nextAudit = applyChecklistItemPatch(workingAudit, input.itemId, {
      notes: input.notes,
      outcome: input.outcome,
    });

    setWorkingAudit(nextAudit);

    const payload = {
      auditId: workingAudit.id,
      itemId: input.itemId,
      notes: input.notes,
      outcome: input.outcome,
      path,
    };

    if (!isOnline) {
      await persistOfflineSnapshot(nextAudit);
      await enqueueMutation('UPDATE_CHECKLIST_ITEM', payload);
      toast.info('Modifica salvata offline. Verrà sincronizzata appena torna la connessione.');
      return {
        success: true,
        offline: true,
      };
    }

    const formData = new FormData();
    formData.append('itemId', input.itemId);
    formData.append('path', path);
    if (input.notes !== undefined) formData.append('notes', input.notes);
    if (input.outcome) formData.append('outcome', input.outcome);

    try {
      const result = await updateChecklistItem(formData);
      if ('error' in result) {
        throw new Error(result.error ?? 'Errore aggiornamento checklist.');
      }

      if (offlineSavedAt) {
        await persistOfflineSnapshot(nextAudit);
      }

      return result;
    } catch (error) {
      if (isNetworkError(error)) {
        await persistOfflineSnapshot(nextAudit);
        await enqueueMutation('UPDATE_CHECKLIST_ITEM', payload);
        toast.info('Rete persa durante il salvataggio. Modifica messa in coda.');
        return {
          success: true,
          offline: true,
        };
      }

      setWorkingAudit(previousAudit);
      throw error;
    }
  };

  const offlineSavedLabel = offlineSavedAt
    ? new Date(offlineSavedAt).toLocaleString('it-IT')
    : null;

  return (
    <div className="space-y-4">
      {!readOnly ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {isOnline ? (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    <Wifi className="mr-1 h-3 w-3" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <CloudOff className="mr-1 h-3 w-3" />
                    Offline
                  </Badge>
                )}
                {offlineSavedAt ? (
                  <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                    Checklist offline pronta
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-zinc-200 text-zinc-600">
                    Non ancora salvata offline
                  </Badge>
                )}
                {pendingAuditSyncCount > 0 ? (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    {pendingAuditSyncCount} modifiche in coda
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-zinc-600">
                Salva questa checklist sul dispositivo prima di andare in assenza di rete. Le
                modifiche offline verranno sincronizzate automaticamente quando la connessione
                torna disponibile.
              </p>
              {offlineSavedLabel ? (
                <p className="text-xs text-zinc-500">
                  Ultimo salvataggio offline: {offlineSavedLabel}
                  {hydratedFromOffline ? ' · stai usando la copia locale' : ''}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                disabled={!isOnline || preparingOffline}
                onClick={prepareOffline}
              >
                {preparingOffline ? (
                  <RefreshCcw className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {offlineSavedAt ? 'Aggiorna copia offline' : 'Salva offline'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {!isOnline && !offlineSavedAt ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          La checklist non era stata preparata offline. Puoi continuare a lavorare solo finché
          questa pagina resta aperta sul dispositivo.
        </div>
      ) : null}

      {!loadingOfflineState ? (
        <ChecklistManager
          audit={workingAudit}
          nonConformities={nonConformities}
          offlineNcItemIds={activeNcItemIds}
          onPersistItem={readOnly ? undefined : persistChecklistItem}
          readOnly={readOnly}
        />
      ) : (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-8 text-sm text-zinc-500 shadow-sm">
          Caricamento stato offline checklist...
        </div>
      )}
    </div>
  );
}
