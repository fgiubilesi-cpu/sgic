import Dexie, { type EntityTable } from 'dexie';

export type SyncStatus = 'pending' | 'failed';

export interface SyncQueueItem {
    id: string; // UUID defined by the client
    actionType: string;
    payload: Record<string, unknown>;
    createdAt: number;
    status: SyncStatus;
    error?: string; // Optional error message if it failed
}

export interface CacheItem {
    key: string;
    data: unknown;
    updatedAt: number;
}

export class SgicLocalDB extends Dexie {
    sync_queue!: EntityTable<SyncQueueItem, 'id'>;
    cache!: EntityTable<CacheItem, 'key'>;

    constructor() {
        super('SgicLocalDatabase');
        this.version(1).stores({
            sync_queue: 'id, actionType, status, createdAt', // Indexed fields
            cache: 'key, updatedAt'
        });
    }
}

export const db = new SgicLocalDB();
