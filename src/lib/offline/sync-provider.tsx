'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, SyncQueueItem } from './db';
import { createClient } from '../supabase/client';
import { patchOfflineAuditChecklistItem } from '@/lib/offline/audit-cache';

interface SyncContextType {
    isOnline: boolean;
    pendingCount: number;
    syncInProgress: boolean;
    enqueueMutation: (actionType: string, payload: any) => Promise<void>;
    manualSync: () => Promise<void>;
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
    }, []);

    const processSyncQueue = async () => {
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
                try {
                    await executeAction(item);
                    await db.sync_queue.delete(item.id);
                    window.dispatchEvent(
                        new CustomEvent('sgic-sync-complete', {
                            detail: {
                                actionType: item.actionType,
                                auditId: item.payload?.auditId ?? null,
                                itemId: item.payload?.itemId ?? null,
                            },
                        })
                    );
                } catch (error: any) {
                    console.error(`Failed to sync item ${item.id}:`, error);
                    await db.sync_queue.update(item.id, {
                        status: 'failed',
                        error: error.message || 'Unknown error'
                    });
                    window.dispatchEvent(
                        new CustomEvent('sgic-sync-failed', {
                            detail: {
                                actionType: item.actionType,
                                auditId: item.payload?.auditId ?? null,
                                itemId: item.payload?.itemId ?? null,
                                error: error.message || 'Unknown error',
                            },
                        })
                    );
                }
            }
        } finally {
            setSyncInProgress(false);
        }
    };

    const executeAction = async (item: SyncQueueItem) => {
        switch (item.actionType) {
            case 'UPDATE_CHECKLIST_ITEM': {
                const { updateChecklistItem } = await import('@/features/audits/actions');
                const formData = new FormData();
                formData.append("itemId", item.payload.itemId);
                if (item.payload.outcome) formData.append("outcome", item.payload.outcome);
                if (item.payload.notes !== undefined) formData.append("notes", item.payload.notes);
                if (item.payload.evidenceUrl !== undefined) formData.append("evidenceUrl", item.payload.evidenceUrl);
                formData.append("path", item.payload.path);

                const res = await updateChecklistItem(formData);
                if (res.error) throw new Error(res.error);
                break;
            }
            case 'CREATE_NC': {
                const { createNC } = await import('@/features/quality/actions/quality-actions');
                const res = await createNC(item.payload);
                if ((res as any)?.error) throw new Error((res as unknown as { error: string }).error);
                break;
            }
            case 'UPLOAD_EVIDENCE': {
                const { uploadEvidencePhoto } = await import('@/features/audits/actions/upload-evidence');
                const formData = new FormData();
                formData.append("file", item.payload.file);
                formData.append("auditId", item.payload.auditId);
                formData.append("itemId", item.payload.itemId);

                const res = await uploadEvidencePhoto(formData);
                if (res.error) throw new Error(res.error);
                break;
            }
            case 'UPLOAD_CHECKLIST_MEDIA': {
                const { uploadChecklistMedia } = await import('@/features/audits/actions');
                const formData = new FormData();
                formData.append("file", item.payload.file);
                formData.append("auditId", item.payload.auditId);
                formData.append("itemId", item.payload.itemId);
                formData.append("type", item.payload.type);
                formData.append("path", item.payload.path);

                const res = await uploadChecklistMedia(formData);
                if (!res.success) throw new Error(res.error ?? 'Errore sync media offline.');

                if (item.payload.type === 'evidence') {
                    await patchOfflineAuditChecklistItem({
                        auditId: item.payload.auditId,
                        itemId: item.payload.itemId,
                        patch: {
                            evidence_url: res.url ?? null,
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

    const enqueueMutation = async (actionType: string, payload: any) => {
        const item: SyncQueueItem = {
            id: crypto.randomUUID(),
            actionType,
            payload,
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
