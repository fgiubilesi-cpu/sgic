'use client';

import { db } from '@/lib/offline/db';
import type { AuditWithChecklists, ChecklistItem } from '@/features/audits/queries/get-audit';

const OFFLINE_AUDIT_PREFIX = 'offline-audit:';

export interface OfflineAuditRecord {
  audit: AuditWithChecklists;
  auditId: string;
  ncItemIds: string[];
  path: string;
  savedAt: number;
}

type ChecklistItemPatch = Partial<
  Pick<ChecklistItem, 'media' | 'notes' | 'outcome'>
>;

function updateAuditChecklistItem(
  audit: AuditWithChecklists,
  itemId: string,
  updater: (item: ChecklistItem) => ChecklistItem
) {
  return {
    ...audit,
    checklists: audit.checklists.map((checklist) => ({
      ...checklist,
      items: checklist.items.map((item) => (item.id === itemId ? updater(item) : item)),
    })),
  } satisfies AuditWithChecklists;
}

function getOfflineAuditKey(auditId: string) {
  return `${OFFLINE_AUDIT_PREFIX}${auditId}`;
}

export function buildOfflineAuditRecord(options: {
  audit: AuditWithChecklists;
  ncItemIds: string[];
  path: string;
}): OfflineAuditRecord {
  return {
    audit: options.audit,
    auditId: options.audit.id,
    ncItemIds: options.ncItemIds,
    path: options.path,
    savedAt: Date.now(),
  };
}

export async function saveOfflineAuditRecord(record: OfflineAuditRecord) {
  await db.cache.put({
    key: getOfflineAuditKey(record.auditId),
    data: record,
    updatedAt: record.savedAt,
  });
}

export async function getOfflineAuditRecord(auditId: string) {
  const entry = await db.cache.get(getOfflineAuditKey(auditId));
  return (entry?.data as OfflineAuditRecord | undefined) ?? null;
}

export async function listOfflineAuditRecords() {
  const rows = await db.cache.toArray();
  return rows
    .filter((row) => row.key.startsWith(OFFLINE_AUDIT_PREFIX))
    .map((row) => row.data as OfflineAuditRecord)
    .sort((left, right) => right.savedAt - left.savedAt);
}

export async function patchOfflineAuditChecklistItem(options: {
  auditId: string;
  itemId: string;
  patch: ChecklistItemPatch;
}) {
  const current = await getOfflineAuditRecord(options.auditId);
  if (!current) return null;

  const nextAudit = updateAuditChecklistItem(current.audit, options.itemId, (item) => ({
    ...item,
    ...options.patch,
  }));

  const nextRecord: OfflineAuditRecord = {
    ...current,
    audit: nextAudit,
    savedAt: Date.now(),
  };

  await saveOfflineAuditRecord(nextRecord);
  return nextRecord;
}

export async function replaceOfflineAuditChecklistItemMedia(options: {
  auditId: string;
  itemId: string;
  mediaId: string;
  replacement: ChecklistItem['media'][number];
}) {
  const current = await getOfflineAuditRecord(options.auditId);
  if (!current) return null;

  const nextAudit = updateAuditChecklistItem(current.audit, options.itemId, (item) => ({
    ...item,
    media: (item.media ?? [])
      .map((media) => (media.id === options.mediaId ? options.replacement : media))
      .filter((media) => Boolean(media.access_url)),
  }));

  const nextRecord: OfflineAuditRecord = {
    ...current,
    audit: nextAudit,
    savedAt: Date.now(),
  };

  await saveOfflineAuditRecord(nextRecord);
  return nextRecord;
}

export async function removeOfflineAuditChecklistItemMedia(options: {
  auditId: string;
  itemId: string;
  mediaId: string;
}) {
  const current = await getOfflineAuditRecord(options.auditId);
  if (!current) return null;

  const nextAudit = updateAuditChecklistItem(current.audit, options.itemId, (item) => ({
    ...item,
    media: (item.media ?? []).filter((media) => media.id !== options.mediaId),
  }));

  const nextRecord: OfflineAuditRecord = {
    ...current,
    audit: nextAudit,
    savedAt: Date.now(),
  };

  await saveOfflineAuditRecord(nextRecord);
  return nextRecord;
}

export async function updateOfflineAuditNcItems(options: {
  auditId: string;
  ncItemIds: string[];
}) {
  const current = await getOfflineAuditRecord(options.auditId);
  if (!current) return null;

  const nextRecord: OfflineAuditRecord = {
    ...current,
    ncItemIds: options.ncItemIds,
    savedAt: Date.now(),
  };

  await saveOfflineAuditRecord(nextRecord);
  return nextRecord;
}
