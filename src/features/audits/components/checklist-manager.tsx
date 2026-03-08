"use client";

import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import type { AuditWithChecklists } from "@/features/audits/queries/get-audit";
import type { AuditOutcome } from "@/types/database.types";
import type { NonConformity } from "@/features/audits/queries/get-non-conformities";
import { ChecklistRow } from "./checklist-row";
import { PhotoPanel } from "./photo-panel";

type ChecklistManagerProps = {
  audit: AuditWithChecklists;
  nonConformities?: NonConformity[];
};

export function ChecklistManager({ audit, nonConformities = [] }: ChecklistManagerProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [photoPanelItemId, setPhotoPanelItemId] = useState<string | null>(null);

  // Build a set of checklist_item_ids that have non-conformities
  const ncItemIds = new Set(nonConformities.map((nc) => nc.checklistItemId));

  if (!audit.checklists || !audit.checklists.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-8 text-sm text-zinc-500 shadow-sm text-center">
        No checklists configured for this audit.
      </div>
    );
  }

  // Calculate progress across all items
  const allItems = audit.checklists.flatMap((c) => c.items || []);
  const totalItems = allItems.length;
  const answeredItems = allItems.filter(
    (item) => (item.outcome as AuditOutcome | null) && (item.outcome as AuditOutcome) !== "pending"
  ).length;
  const progressPercent = totalItems === 0 ? 0 : Math.round((answeredItems / totalItems) * 100);

  // Flatten all items with checklist context for table rendering
  const allItemsWithChecklist = audit.checklists.flatMap((checklist) =>
    (checklist.items || []).map((item, idx) => ({
      ...item,
      checklistId: checklist.id,
      checklistTitle: checklist.title,
      itemIndex: idx + 1,
    }))
  );

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-4 border-b border-zinc-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
              Checklists
            </h2>
            <p className="text-sm text-zinc-500">
              {totalItems} questions • {answeredItems} answered
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-zinc-900">{progressPercent}%</p>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-8">#</th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700">Question</th>
              <th className="px-3 py-3 text-center font-semibold text-zinc-700 w-16">OK</th>
              <th className="px-3 py-3 text-center font-semibold text-zinc-700 w-16">NOK</th>
              <th className="px-3 py-3 text-center font-semibold text-zinc-700 w-16">N/A</th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 flex-1">Notes</th>
              <th className="px-3 py-3 text-center font-semibold text-zinc-700 w-8"></th>
            </tr>
          </thead>
          <tbody>
            {allItemsWithChecklist.length > 0 ? (
              allItemsWithChecklist.map((item, idx) => (
                <ChecklistRow
                  key={item.id}
                  id={item.id}
                  itemNumber={idx + 1}
                  question={item.question}
                  initialOutcome={(item.outcome as AuditOutcome) ?? "pending"}
                  initialNotes={item.notes ?? null}
                  initialEvidenceUrl={item.evidence_url ?? null}
                  auditId={audit.id}
                  isSelected={selectedItemId === item.id}
                  hasNc={ncItemIds.has(item.id)}
                  onSelect={() => setSelectedItemId(item.id)}
                  onPhotoClick={() => setPhotoPanelItemId(item.id)}
                  path={`/audits/${audit.id}`}
                />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-zinc-500 italic">
                  No items to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Photo Panel */}
      {photoPanelItemId && (
        <PhotoPanel
          itemId={photoPanelItemId}
          auditId={audit.id}
          onClose={() => setPhotoPanelItemId(null)}
        />
      )}
    </div>
  );
}
