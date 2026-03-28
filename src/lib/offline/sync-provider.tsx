'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, SyncQueueItem } from './db';
import { createClient } from '../supabase/client';
import {
    replaceOfflineAuditChecklistItemMedia,
} from '@/lib/offline/audit-cache';

interface SyncContextType {
    isOnline: boolean;
    pendingCount: number;
    syncInProgress: boolean;
    enqueueMutation: (actionType: string, payload: unknown) => Promise<void>;
    manualSync: () => Promise<void>;
}

type SyncErrorResult = {
    error?: string;
};

type SyncPayload = Record<string, unknown>;

type CreateNcPayload = {
    action_plan?: string;
    description: string;
    identified_date: string;
    organization_id?: string;
    root_cause_analysis?: string;
    severity: 'critical' | 'major' | 'minor';
    status: 'closed' | 'open' | 'pending_verification';
    title: string;
};

function isRecord(value: unknown): value is SyncPayload {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPayload(item: SyncQueueItem): SyncPayload {
    return isRecord(item.payload) ? item.payload : {};
}

function getStringField(payload: SyncPayload, key: string): string | undefined {
    const value = payload[key];
    return typeof value === 'string' ? value : undefined;
}

function getFileField(payload: SyncPayload, key: string): File | undefined {
    const value = payload[key];
    return value instanceof File ? value : undefined;
}

function toCreateNcPayload(payload: SyncPayload): CreateNcPayload | null {
    const title = getStringField(payload, 'title');
    const description = getStringField(payload, 'description');
    const identifiedDate = getStringField(payload, 'identified_date');
    const severity = getStringField(payload, 'severity');
    const status = getStringField(payload, 'status');

    if (
        !title ||
        !description ||
        !identifiedDate ||
        !severity ||
        !status ||
        !['critical', 'major', 'minor'].includes(severity) ||
        !['closed', 'open', 'pending_verification'].includes(status)
    ) {
        return null;
    }

    return {
        title,
        description,
        identified_date: identifiedDate,
        severity: severity as CreateNcPayload['severity'],
        status: status as CreateNcPayload['status'],
        action_plan: getStringField(payload, 'action_plan'),
        organization_id: getStringField(payload, 'organization_id'),
        root_cause_analysis: getStringField(payload, 'root_cause_analysis'),
    };
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return 'Unknown error';
}

function hasSyncError(value: unknown): value is SyncErrorResult {
    return typeof value === 'object' && value !== null && 'error' in value && typeof value.error === 'string';
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(true);
    const [syncInProgress, setSyncInProgress] = useState(false);

    // Real-time count of pending sync items
    const pendingCount = useLiveQuery(
        async () => {
            const items = await db.sync_queue.toArray();
            return items.filter((item) => item.status === 'pending' || item.status === 'failed').length;
        },
        []
    ) ?? 0;

    const processSyncQueue = useCallback(async () => {
        if (syncInProgress) return;
        setSyncInProgress(true);

        try {
            const queuedItems = await db.sync_queue.toArray();
            const pendingItems = queuedItems
                .filter((item) => item.status === 'pending' || item.status === 'failed')
                .sort((left, right) => left.createdAt - right.createdAt);

            if (pendingItems.length === 0) {
                setSyncInProgress(false);
                return;
            }

            // Ensure Supabase auth token is fresh before attempting server actions
            const supabase = createClient();
            await supabase.auth.refreshSession();

            for (const item of pendingItems) {
                const payload = getPayload(item);
                try {
                    await executeAction(item);
                    await db.sync_queue.delete(item.id);
                    window.dispatchEvent(
                        new CustomEvent('sgic-sync-complete', {
                            detail: {
                                actionType: item.actionType,
                                auditId: getStringField(payload, 'auditId') ?? null,
                                itemId: getStringField(payload, 'itemId') ?? null,
                            },
                        })
                    );
                } catch (error: unknown) {
                    const message = getErrorMessage(error);
                    console.error(`Failed to sync item ${item.id}:`, error);
                    await db.sync_queue.update(item.id, {
                        status: 'failed',
                        error: message
                    });
                    window.dispatchEvent(
                        new CustomEvent('sgic-sync-failed', {
                            detail: {
                                actionType: item.actionType,
                                auditId: getStringField(payload, 'auditId') ?? null,
                                itemId: getStringField(payload, 'itemId') ?? null,
                                error: message,
                            },
                        })
                    );
                }
            }
        } finally {
            setSyncInProgress(false);
        }
    }, [syncInProgress]);

    useEffect(() => {
        // Initial status
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            processSyncQueue();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Initial check just in case we are loaded online with pending items
        if (navigator.onLine) {
            processSyncQueue();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [processSyncQueue]);

    const executeAction = async (item: SyncQueueItem) => {
        const payload = getPayload(item);

        switch (item.actionType) {
            case 'UPDATE_CHECKLIST_ITEM': {
                const itemId = getStringField(payload, 'itemId');
                const path = getStringField(payload, 'path');
                if (!itemId || !path) {
                    throw new Error('Payload offline checklist non valido.');
                }

                const { updateChecklistItem } = await import('@/features/audits/actions');
                const formData = new FormData();
                formData.append("itemId", itemId);
                if (getStringField(payload, 'outcome')) formData.append("outcome", getStringField(payload, 'outcome')!);
                if (getStringField(payload, 'notes') !== undefined) formData.append("notes", getStringField(payload, 'notes')!);
                if (getStringField(payload, 'evidenceUrl') !== undefined) formData.append("evidenceUrl", getStringField(payload, 'evidenceUrl')!);
                formData.append("path", path);

                const res = await updateChecklistItem(formData);
                if (res.error) throw new Error(res.error);
                break;
            }
            case 'CREATE_NC': {
                const createNcPayload = toCreateNcPayload(payload);
                if (!createNcPayload) {
                    throw new Error('Payload offline NC non valido.');
                }

                const { createNC } = await import('@/features/quality/actions/quality-actions');
                const res = await createNC(createNcPayload);
                if (hasSyncError(res)) throw new Error(res.error);
                break;
            }
            case 'UPLOAD_EVIDENCE': {
                const file = getFileField(payload, 'file');
                const auditId = getStringField(payload, 'auditId');
                const itemId = getStringField(payload, 'itemId');
                if (!file || !auditId || !itemId) {
                    throw new Error('Payload offline evidence non valido.');
                }

                const { uploadEvidencePhoto } = await import('@/features/audits/actions/upload-evidence');
                const formData = new FormData();
                formData.append("file", file);
                formData.append("auditId", auditId);
                formData.append("itemId", itemId);

                const res = await uploadEvidencePhoto(formData);
                if (res.error) throw new Error(res.error);
                break;
            }
            case 'UPLOAD_CHECKLIST_MEDIA': {
                const file = getFileField(payload, 'file');
                const auditId = getStringField(payload, 'auditId');
                const itemId = getStringField(payload, 'itemId');
                const path = getStringField(payload, 'path');
                const localMediaId = getStringField(payload, 'localMediaId');
                if (!file || !auditId || !itemId || !path) {
                    throw new Error('Payload offline media non valido.');
                }

                const { uploadChecklistMedia } = await import('@/features/audits/actions');
                const formData = new FormData();
                formData.append("file", file);
                formData.append("auditId", auditId);
                formData.append("itemId", itemId);
                formData.append("path", path);

                const res = await uploadChecklistMedia(formData);
                if (!res.success) throw new Error(res.error ?? 'Errore sync media offline.');

                if (localMediaId) {
                    await replaceOfflineAuditChecklistItemMedia({
                        auditId,
                        itemId,
                        mediaId: localMediaId,
                        replacement: {
                            ...res.media,
                            pending_sync: false,
                            source: 'current',
                        },
                    });
                }
                break;
            }
            default:
                console.warn(`Unrecognized offline actionType: ${item.actionType}`);
                break;
        }
    };

    const enqueueMutation = async (actionType: string, payload: unknown) => {
        const item: SyncQueueItem = {
            id: crypto.randomUUID(),
            actionType,
            payload: isRecord(payload) ? payload : {},
            createdAt: Date.now(),
            status: 'pending',
        };

        await db.sync_queue.add(item);

        // Attempt sync immediate if we happen to actually be online
        if (navigator.onLine) {
            processSyncQueue();
        }
    };

    return (
        <SyncContext.Provider value={{
            isOnline,
            pendingCount,
            syncInProgress,
            enqueueMutation,
            manualSync: processSyncQueue
        }}>
            {children}
        </SyncContext.Provider>
    );
}

export function useSync() {
    const context = useContext(SyncContext);
    if (context === undefined) {
        throw new Error('useSync must be used within a SyncProvider');
    }
    return context;
}
