import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import type { Audit } from "@/features/audits/queries/get-audits";
import type { AuditStatus, AuditOutcome } from "@/features/audits/schemas/audit-schema";
import type { ChecklistItemMedia } from "@/features/audits/lib/checklist-media";
import {
  CHECKLIST_MEDIA_BUCKET,
  createSignedUrlMapForObjects,
  parseStorageObjectFromUrl,
  sortChecklistItemMedia,
  getStorageObjectKey,
} from "@/features/audits/lib/checklist-media";

export type ChecklistItem = {
  id: string;
  question: string;
  outcome: AuditOutcome | null;
  notes?: string | null;
  evidence_url?: string | null;
  audio_url?: string | null;
  media: ChecklistItemMedia[];
  created_at: string | null;
};

export type Checklist = {
  id: string;
  title: string | null;
  template_id: string | null;
  created_at: string | null;
  items: ChecklistItem[];
};

export type AuditWithChecklists = Audit & {
  checklists: Checklist[];
  score?: number | null;
};

function asSortedChecklistItems(rawItems: unknown[] | null | undefined) {
  return [...(rawItems ?? [])].sort((left, right) => {
    const leftSortOrder =
      typeof (left as { sort_order?: unknown })?.sort_order === "number"
        ? ((left as { sort_order?: number }).sort_order ?? 0)
        : 0;
    const rightSortOrder =
      typeof (right as { sort_order?: unknown })?.sort_order === "number"
        ? ((right as { sort_order?: number }).sort_order ?? 0)
        : 0;

    if (leftSortOrder !== rightSortOrder) {
      return leftSortOrder - rightSortOrder;
    }

    const leftCreatedAt = (left as { created_at?: string | null })?.created_at;
    const rightCreatedAt = (right as { created_at?: string | null })?.created_at;
    return (leftCreatedAt ?? "").localeCompare(rightCreatedAt ?? "");
  });
}

export async function getAudit(id: string): Promise<AuditWithChecklists | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const { supabase, organizationId } = ctx;

  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("id, title, status, scheduled_date, score, template_id, organization_id, client_id, location_id")
    .eq("id", id)
    .eq("organization_id", organizationId)
    .single();

  if (auditError || !audit) return null;

  const [{ data: client }, { data: location }] = await Promise.all([
    (audit as { client_id?: string | null }).client_id
      ? supabase
          .from("clients")
          .select("name")
          .eq("id", (audit as { client_id?: string | null }).client_id!)
          .maybeSingle()
      : Promise.resolve({ data: null as { name?: string | null } | null }),
    (audit as { location_id?: string | null }).location_id
      ? supabase
          .from("locations")
          .select("name")
          .eq("id", (audit as { location_id?: string | null }).location_id!)
          .maybeSingle()
      : Promise.resolve({ data: null as { name?: string | null } | null }),
  ]);

  const rawStatus = (audit as { status?: string | null }).status ?? "Scheduled";
  const allowedStatuses: AuditStatus[] = ["Scheduled", "In Progress", "Review", "Closed"];
  const status: AuditStatus = allowedStatuses.includes(rawStatus as AuditStatus)
    ? (rawStatus as AuditStatus)
    : "Scheduled";

  let checklists: Checklist[] = [];

  const { data: rawChecklists, error: checklistError } = await supabase
    .from("checklists")
    .select(
      "id, title, template_id, created_at, checklist_items(id, question, outcome, notes, evidence_url, audio_url, created_at, sort_order)"
    )
    .eq("audit_id", id);

  if (checklistError) {
    console.error("[getAudit] Unable to load checklists for audit", {
      auditId: id,
      error: checklistError,
    });
  } else if (rawChecklists) {
    const itemIds = rawChecklists.flatMap((rawChecklist) => {
      const checklist = rawChecklist as { checklist_items?: unknown[] | null };
      return asSortedChecklistItems(checklist.checklist_items).flatMap((rawItem) => {
        const item = rawItem as { id?: string | number | null };
        return item.id ? [String(item.id)] : [];
      });
    });

    const currentMediaByItemId = new Map<string, ChecklistItemMedia[]>();
    let mediaErrorMessage: string | null = null;

    if (itemIds.length > 0) {
      const { data: mediaRows, error: mediaError } = await supabase
        .from("checklist_item_media")
        .select(
          "id, checklist_item_id, audit_id, organization_id, storage_path, mime_type, media_kind, original_name, created_at"
        )
        .eq("organization_id", organizationId)
        .eq("audit_id", id)
        .in("checklist_item_id", itemIds);

      if (mediaError) {
        mediaErrorMessage = mediaError.message;
        console.error("[getAudit] Unable to load checklist item media; continuing without media", {
          auditId: id,
          error: mediaError,
        });
      } else {
        const storageRefs = mediaRows.flatMap((media) =>
          media.storage_path
            ? [
                {
                  bucket: CHECKLIST_MEDIA_BUCKET,
                  path: media.storage_path,
                },
              ]
            : []
        );

        const signedUrlMap = await createSignedUrlMapForObjects(supabase, storageRefs);

        for (const media of mediaRows ?? []) {
          if (!media.storage_path) continue;

          const checklistItemId = String(media.checklist_item_id);
          const nextMedia = {
            id: String(media.id),
            checklist_item_id: checklistItemId,
            audit_id: media.audit_id ?? id,
            organization_id: media.organization_id ?? organizationId,
            storage_path: media.storage_path,
            mime_type: media.mime_type ?? null,
            media_kind: media.media_kind === "video" ? "video" : "image",
            created_at: media.created_at ?? null,
            access_url:
              signedUrlMap.get(
                getStorageObjectKey({
                  bucket: CHECKLIST_MEDIA_BUCKET,
                  path: media.storage_path,
                })
              ) ?? null,
            original_name: media.original_name ?? null,
            source: "current",
          } satisfies ChecklistItemMedia;

          const existingMedia = currentMediaByItemId.get(checklistItemId) ?? [];
          currentMediaByItemId.set(checklistItemId, [...existingMedia, nextMedia]);
        }
      }
    }

    const legacyStorageRefs = rawChecklists.flatMap((rawChecklist) => {
      const checklist = rawChecklist as { checklist_items?: unknown[] | null };
      return asSortedChecklistItems(checklist.checklist_items).flatMap((rawItem) => {
        const item = rawItem as { evidence_url?: string | null };
        const legacyRef = parseStorageObjectFromUrl(item.evidence_url);
        return legacyRef ? [legacyRef] : [];
      });
    });
    const legacySignedUrlMap = await createSignedUrlMapForObjects(supabase, legacyStorageRefs);

    checklists = rawChecklists.map((rawChecklist) => {
      const checklist = rawChecklist as {
        id?: string | number;
        title?: string | null;
        template_id?: string | null;
        created_at?: string | null;
        checklist_items?: unknown[] | null;
      };

      const rawItems = asSortedChecklistItems(checklist.checklist_items);
      const items: ChecklistItem[] = rawItems.map((rawItem) => {
        const item = rawItem as {
          id?: string | number;
          question?: string | null;
          outcome?: string | null;
          notes?: string | null;
          evidence_url?: string | null;
          audio_url?: string | null;
          created_at?: string | null;
        };

        const validOutcomes: AuditOutcome[] = [
          "compliant",
          "non_compliant",
          "not_applicable",
          "pending",
        ];
        const rawOutcome = item.outcome ?? "pending";
        const outcome: AuditOutcome = validOutcomes.includes(rawOutcome as AuditOutcome)
          ? (rawOutcome as AuditOutcome)
          : "pending";

        const currentMedia = sortChecklistItemMedia(
          (currentMediaByItemId.get(String(item.id)) ?? []).filter((media) => Boolean(media.access_url))
        );

        const legacyRef = parseStorageObjectFromUrl(item.evidence_url);
        const legacyMedia =
          item.evidence_url &&
          !currentMedia.some(
            (media) => Boolean(media.storage_path) && media.storage_path === legacyRef?.path
          )
            ? [
                {
                  id: `legacy-${String(item.id)}`,
                  checklist_item_id: String(item.id),
                  audit_id: id,
                  organization_id: organizationId,
                  storage_path: legacyRef?.path ?? null,
                  mime_type: null,
                  media_kind: "image",
                  created_at: item.created_at ?? null,
                  access_url: legacyRef
                    ? legacySignedUrlMap.get(getStorageObjectKey(legacyRef)) ?? item.evidence_url
                    : item.evidence_url,
                  original_name: null,
                  source: "legacy",
                } satisfies ChecklistItemMedia,
              ]
            : [];

        return {
          id: String(item.id),
          question: item.question ?? "Untitled Question",
          outcome,
          notes: item.notes ?? null,
          evidence_url: item.evidence_url ?? null,
          audio_url: item.audio_url ?? null,
          media: sortChecklistItemMedia(
            [...currentMedia, ...legacyMedia].filter((media) => Boolean(media.access_url))
          ),
          created_at: item.created_at ?? null,
        };
      });

      return {
        id: String(checklist.id),
        title: checklist.title ?? null,
        template_id: checklist.template_id ?? null,
        created_at: checklist.created_at ?? null,
        items,
      };
    });

    if (mediaErrorMessage) {
      console.warn("[getAudit] Checklist media unavailable; checklist returned without media", {
        auditId: id,
        mediaErrorMessage,
      });
    }
  }

  return {
    id: String(audit.id),
    title: (audit as { title?: string | null }).title ?? null,
    status,
    scheduled_date: (audit as { scheduled_date?: string | null }).scheduled_date ?? null,
    score: (audit as { score?: number | null }).score ?? null,
    template_id: (audit as { template_id?: string | null }).template_id ?? null,
    client_id: (audit as { client_id?: string | null }).client_id ?? null,
    location_id: (audit as { location_id?: string | null }).location_id ?? null,
    client_name: client?.name ?? null,
    location_name: location?.name ?? null,
    checklists: checklists.length > 0 ? checklists : [],
  };
}
