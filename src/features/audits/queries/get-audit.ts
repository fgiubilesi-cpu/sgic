import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import type { Audit } from "@/features/audits/queries/get-audits";
import type { AuditStatus, AuditOutcome } from "@/features/audits/schemas/audit-schema";
import {
  CHECKLIST_MEDIA_BUCKET,
  createSignedUrlMapForObjects,
  type ChecklistItemMedia,
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
  created_at: string | null;
  items: ChecklistItem[];
};

export type AuditWithChecklists = Audit & {
  checklists: Checklist[];
  score?: number | null;
};

export async function getAudit(id: string): Promise<AuditWithChecklists | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const { supabase, organizationId } = ctx;

  const { data: audit, error: auditError } = await supabase
    .from("audits")
    .select("id, title, status, scheduled_date, score, organization_id, client_id, location_id")
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
      "id, title, created_at, checklist_items(id, question, outcome, notes, evidence_url, audio_url, created_at, checklist_item_media(id, checklist_item_id, audit_id, organization_id, storage_path, mime_type, media_kind, original_name, created_at))"
    )
    .eq("audit_id", id);

  if (!checklistError && rawChecklists) {
    const storageRefs = rawChecklists.flatMap((rawChecklist) => {
      const checklist = rawChecklist as {
        checklist_items?: unknown[] | null;
      };

      return (checklist.checklist_items ?? []).flatMap((rawItem) => {
        const item = rawItem as {
          evidence_url?: string | null;
          checklist_item_media?: unknown[] | null;
        };

        const mediaRefs = (item.checklist_item_media ?? []).flatMap((rawMedia) => {
          const media = rawMedia as {
            storage_path?: string | null;
          };

          return media.storage_path
            ? [
                {
                  bucket: CHECKLIST_MEDIA_BUCKET,
                  path: media.storage_path,
                },
              ]
            : [];
        });

        const legacyRef = parseStorageObjectFromUrl(item.evidence_url);
        return legacyRef ? [...mediaRefs, legacyRef] : mediaRefs;
      });
    });

    const signedUrlMap = await createSignedUrlMapForObjects(supabase, storageRefs);

    checklists = rawChecklists.map((rawChecklist) => {
      const checklist = rawChecklist as {
        id?: string | number;
        title?: string | null;
        created_at?: string | null;
        checklist_items?: unknown[] | null;
      };

      const rawItems = checklist.checklist_items ?? [];
      const items: ChecklistItem[] = rawItems.map((rawItem) => {
        const item = rawItem as {
          id?: string | number;
          question?: string | null;
          outcome?: string | null;
          notes?: string | null;
          evidence_url?: string | null;
          audio_url?: string | null;
          created_at?: string | null;
          checklist_item_media?: unknown[] | null;
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

        const currentMedia = (item.checklist_item_media ?? []).flatMap((rawMedia) => {
          const media = rawMedia as {
            id?: string | number;
            checklist_item_id?: string | null;
            audit_id?: string | null;
            organization_id?: string | null;
            storage_path?: string | null;
            mime_type?: string | null;
            media_kind?: string | null;
            original_name?: string | null;
            created_at?: string | null;
          };

          if (!media.storage_path) return [];

          return [
            {
              id: String(media.id),
              checklist_item_id: media.checklist_item_id ?? String(item.id),
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
            } satisfies ChecklistItemMedia,
          ];
        });

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
                    ? signedUrlMap.get(getStorageObjectKey(legacyRef)) ?? item.evidence_url
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
        created_at: checklist.created_at ?? null,
        items,
      };
    });
  }

  return {
    id: String(audit.id),
    title: (audit as { title?: string | null }).title ?? null,
    status,
    scheduled_date: (audit as { scheduled_date?: string | null }).scheduled_date ?? null,
    score: (audit as { score?: number | null }).score ?? null,
    client_id: (audit as { client_id?: string | null }).client_id ?? null,
    location_id: (audit as { location_id?: string | null }).location_id ?? null,
    client_name: client?.name ?? null,
    location_name: location?.name ?? null,
    checklists: checklists.length > 0 ? checklists : [],
  };
}
