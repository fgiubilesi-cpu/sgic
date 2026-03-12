import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

export const CHECKLIST_MEDIA_BUCKET = 'checklist-media';
export const LEGACY_AUDIT_EVIDENCE_BUCKET = 'audit-evidence';
export const CHECKLIST_MEDIA_SIGNED_URL_EXPIRY = 60 * 60 * 6;

export type ChecklistMediaKind = 'image' | 'video';

export type ChecklistItemMedia = {
  id: string;
  checklist_item_id: string;
  audit_id: string;
  organization_id: string;
  storage_path: string | null;
  mime_type: string | null;
  media_kind: ChecklistMediaKind;
  created_at: string | null;
  access_url: string | null;
  original_name?: string | null;
  pending_sync?: boolean;
  source?: 'current' | 'legacy' | 'offline';
};

export type StorageObjectRef = {
  bucket: string;
  path: string;
};

type TypedSupabaseClient = SupabaseClient<Database>;

function sanitizeFileStem(fileName: string) {
  const stem = fileName.replace(/\.[^/.]+$/, '');
  return stem
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'media';
}

export function getMediaKindFromMimeType(mimeType?: string | null): ChecklistMediaKind {
  return mimeType?.startsWith('video/') ? 'video' : 'image';
}

export function isVideoMedia(media: Pick<ChecklistItemMedia, 'media_kind' | 'mime_type'>) {
  return media.media_kind === 'video' || media.mime_type?.startsWith('video/') === true;
}

export function getFileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.trim().toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName;
  }

  switch (file.type) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'video/mp4':
      return 'mp4';
    case 'video/webm':
      return 'webm';
    case 'video/quicktime':
      return 'mov';
    default:
      return getMediaKindFromMimeType(file.type) === 'video' ? 'mp4' : 'jpg';
  }
}

export function buildChecklistMediaStoragePath(input: {
  organizationId: string;
  auditId: string;
  itemId: string;
  file: File;
}) {
  const ext = getFileExtension(input.file);
  const safeStem = sanitizeFileStem(input.file.name);
  return `${input.organizationId}/${input.auditId}/${input.itemId}/${Date.now()}-${crypto.randomUUID()}-${safeStem}.${ext}`;
}

export function getStorageObjectKey(ref: StorageObjectRef) {
  return `${ref.bucket}:${ref.path}`;
}

export function parseStorageObjectFromUrl(url?: string | null): StorageObjectRef | null {
  if (!url) return null;

  const cleanUrl = url.split('?')[0] ?? url;
  const buckets = [CHECKLIST_MEDIA_BUCKET, LEGACY_AUDIT_EVIDENCE_BUCKET];

  for (const bucket of buckets) {
    const marker = `/${bucket}/`;
    const markerIndex = cleanUrl.indexOf(marker);
    if (markerIndex === -1) continue;

    const encodedPath = cleanUrl.slice(markerIndex + marker.length);
    const path = decodeURIComponent(encodedPath);
    if (!path) continue;

    return {
      bucket,
      path,
    };
  }

  return null;
}

export async function createSignedUrlMapForObjects(
  supabase: TypedSupabaseClient,
  refs: StorageObjectRef[],
  expiresIn = CHECKLIST_MEDIA_SIGNED_URL_EXPIRY
) {
  const signedUrlMap = new Map<string, string>();
  const uniqueRefs = Array.from(
    new Map(
      refs
        .filter((ref) => Boolean(ref.bucket) && Boolean(ref.path))
        .map((ref) => [getStorageObjectKey(ref), ref])
    ).values()
  );

  await Promise.all(
    uniqueRefs.map(async (ref) => {
      const { data } = await supabase.storage.from(ref.bucket).createSignedUrl(ref.path, expiresIn);
      if (data?.signedUrl) {
        signedUrlMap.set(getStorageObjectKey(ref), data.signedUrl);
      }
    })
  );

  return signedUrlMap;
}

export function sortChecklistItemMedia(media: ChecklistItemMedia[]) {
  return [...media].sort((left, right) => {
    const leftTime = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightTime = right.created_at ? new Date(right.created_at).getTime() : 0;
    return rightTime - leftTime;
  });
}
