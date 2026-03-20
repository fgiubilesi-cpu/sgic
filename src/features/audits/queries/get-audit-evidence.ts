import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { getAudit } from "@/features/audits/queries/get-audit";
import type { ChecklistMediaKind } from "@/features/audits/lib/checklist-media";
import { isVideoMedia } from "@/features/audits/lib/checklist-media";

export type EvidenceItem = {
  id: string;
  checklistItemId: string;
  question: string;
  outcome: string;
  evidenceUrl: string;
  uploadedAt: string | null;
  mediaKind: ChecklistMediaKind;
};

export type AuditEvidence = {
  auditId: string;
  organizationId: string;
  evidenceItems: EvidenceItem[];
  totalCount: number;
};

function sortEvidenceItems(items: EvidenceItem[]) {
  return [...items].sort((left, right) => {
    const leftTime = left.uploadedAt ? new Date(left.uploadedAt).getTime() : 0;
    const rightTime = right.uploadedAt ? new Date(right.uploadedAt).getTime() : 0;
    return rightTime - leftTime;
  });
}

export async function getAuditEvidence(auditId: string): Promise<AuditEvidence | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const audit = await getAudit(auditId);
  if (!audit) return null;

  const evidenceItems = sortEvidenceItems(
    audit.checklists.flatMap((checklist) =>
      checklist.items.flatMap((item) =>
        item.media
          .filter((media) => media.access_url && !isVideoMedia(media))
          .map((media) => ({
            id: media.id,
            checklistItemId: item.id,
            question: item.question ?? "Untitled Question",
            outcome: item.outcome ?? "pending",
            evidenceUrl: media.access_url!,
            uploadedAt: media.created_at ?? item.created_at ?? null,
            mediaKind: media.media_kind,
          }))
      )
    )
  );

  return {
    auditId,
    organizationId: ctx.organizationId,
    evidenceItems,
    totalCount: evidenceItems.length,
  };
}

export async function getAuditEvidenceByOutcome(
  auditId: string,
  outcome: string
): Promise<EvidenceItem[]> {
  const evidence = await getAuditEvidence(auditId);
  if (!evidence) return [];
  return evidence.evidenceItems.filter((item) => item.outcome === outcome);
}
