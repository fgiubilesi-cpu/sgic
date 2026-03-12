import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/types/database.types';

type DocumentRow = Tables<'documents'>;

export interface DocumentListItem extends DocumentRow {
  access_url: string | null;
  client_name: string | null;
  ingestion_status: string;
  last_review_action: string | null;
  last_reviewed_at: string | null;
  linked_entity_count: number;
  location_name: string | null;
  personnel_name: string | null;
  review_count: number;
  version_count: number;
}

interface GetDocumentsOptions {
  clientIds?: string[];
  locationIds?: string[];
  organizationId: string;
  personnelIds?: string[];
}

export async function getDocuments({
  clientIds,
  locationIds,
  organizationId,
  personnelIds,
}: GetDocumentsOptions): Promise<DocumentListItem[]> {
  const supabase = await createClient();

  const query = supabase
    .from('documents')
    .select('*')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false });

  const { data: documents, error } = await query;

  if (error) throw error;

  const filteredDocuments = (documents ?? []).filter((document) => {
    const matchesClient = !clientIds?.length || (document.client_id ? clientIds.includes(document.client_id) : false);
    const matchesLocation =
      !locationIds?.length || (document.location_id ? locationIds.includes(document.location_id) : false);
    const matchesPersonnel =
      !personnelIds?.length || (document.personnel_id ? personnelIds.includes(document.personnel_id) : false);

    if (clientIds?.length || locationIds?.length || personnelIds?.length) {
      return matchesClient || matchesLocation || matchesPersonnel;
    }

    return true;
  });

  const documentClientIds = Array.from(
    new Set(filteredDocuments.map((document) => document.client_id).filter(Boolean))
  ) as string[];
  const documentLocationIds = Array.from(
    new Set(filteredDocuments.map((document) => document.location_id).filter(Boolean))
  ) as string[];
  const documentPersonnelIds = Array.from(
    new Set(filteredDocuments.map((document) => document.personnel_id).filter(Boolean))
  ) as string[];

  const [
    { data: clients, error: clientsError },
    { data: locations, error: locationsError },
    { data: personnel, error: personnelError },
    { data: versions, error: versionsError },
    { data: reviews, error: reviewsError },
    { data: entities, error: entitiesError },
  ] = await Promise.all([
    documentClientIds.length
      ? supabase.from('clients').select('id, name').in('id', documentClientIds)
      : Promise.resolve({ data: [], error: null }),
    documentLocationIds.length
      ? supabase.from('locations').select('id, name').in('id', documentLocationIds)
      : Promise.resolve({ data: [], error: null }),
    documentPersonnelIds.length
      ? supabase
          .from('personnel')
          .select('id, first_name, last_name')
          .in('id', documentPersonnelIds)
      : Promise.resolve({ data: [], error: null }),
    filteredDocuments.length
      ? supabase
          .from('document_versions')
          .select('document_id')
          .in(
            'document_id',
            filteredDocuments.map((document) => document.id)
          )
      : Promise.resolve({ data: [], error: null }),
    filteredDocuments.length
      ? supabase
          .from('document_extraction_reviews')
          .select('document_id, review_action, reviewed_at, created_at')
          .in(
            'document_id',
            filteredDocuments.map((document) => document.id)
          )
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    filteredDocuments.length
      ? supabase
          .from('document_entities')
          .select('document_id')
          .in(
            'document_id',
            filteredDocuments.map((document) => document.id)
          )
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (clientsError) throw clientsError;
  if (locationsError) throw locationsError;
  if (personnelError) throw personnelError;
  if (versionsError) throw versionsError;
  if (reviewsError) throw reviewsError;
  if (entitiesError) throw entitiesError;

  const clientMap = new Map((clients ?? []).map((client) => [client.id, client.name]));
  const locationMap = new Map((locations ?? []).map((location) => [location.id, location.name]));
  const personnelMap = new Map(
    (personnel ?? []).map((person) => [person.id, `${person.first_name} ${person.last_name}`.trim()])
  );
  const versionCountMap = new Map<string, number>();
  for (const version of versions ?? []) {
    versionCountMap.set(version.document_id, (versionCountMap.get(version.document_id) ?? 0) + 1);
  }
  const reviewCountMap = new Map<string, number>();
  const latestReviewMap = new Map<string, { review_action: string | null; reviewed_at: string | null }>();
  for (const review of reviews ?? []) {
    reviewCountMap.set(review.document_id, (reviewCountMap.get(review.document_id) ?? 0) + 1);
    if (!latestReviewMap.has(review.document_id)) {
      latestReviewMap.set(review.document_id, {
        review_action: review.review_action ?? null,
        reviewed_at: review.reviewed_at ?? null,
      });
    }
  }
  const linkedEntityCountMap = new Map<string, number>();
  for (const entity of entities ?? []) {
    linkedEntityCountMap.set(entity.document_id, (linkedEntityCountMap.get(entity.document_id) ?? 0) + 1);
  }

  const storagePaths = Array.from(
    new Set(
      filteredDocuments
        .map((document) => document.storage_path)
        .filter((path): path is string => Boolean(path))
    )
  );

  const signedUrlMap = new Map<string, string>();
  if (storagePaths.length > 0) {
    await Promise.all(
      storagePaths.map(async (path) => {
        const { data: signedData } = await supabase.storage
          .from('documents')
          .createSignedUrl(path, 60 * 60 * 6);
        if (signedData?.signedUrl) {
          signedUrlMap.set(path, signedData.signedUrl);
        }
      })
    );
  }

  return filteredDocuments.map((document) => ({
    ...document,
    access_url: document.storage_path ? signedUrlMap.get(document.storage_path) ?? null : null,
    client_name: document.client_id ? clientMap.get(document.client_id) ?? null : null,
    ingestion_status: document.ingestion_status ?? 'manual',
    last_review_action: latestReviewMap.get(document.id)?.review_action ?? null,
    last_reviewed_at: latestReviewMap.get(document.id)?.reviewed_at ?? null,
    linked_entity_count: linkedEntityCountMap.get(document.id) ?? 0,
    location_name: document.location_id ? locationMap.get(document.location_id) ?? null : null,
    personnel_name: document.personnel_id ? personnelMap.get(document.personnel_id) ?? null : null,
    review_count: reviewCountMap.get(document.id) ?? 0,
    version_count: Math.max(versionCountMap.get(document.id) ?? 0, document.storage_path ? 1 : 0),
  }));
}
