"use client";

import { useState, useEffect } from "react";
import { Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuditWithChecklists } from "@/features/audits/queries/get-audit";
import type { AuditOutcome } from "@/features/audits/schemas/audit-schema";
import type { NonConformity } from "@/features/audits/queries/get-non-conformities";
import { ChecklistRow } from "./checklist-row";

type PersistChecklistItemInput = {
  itemId: string;
  notes?: string;
  outcome?: AuditOutcome;
};

type ChecklistManagerProps = {
  audit: AuditWithChecklists;
  nonConformities?: NonConformity[];
  offlineNcItemIds?: string[];
  onPersistItem?: (input: PersistChecklistItemInput) => Promise<{
    error?: string;
    ncCancelled?: boolean;
    ncCreated?: boolean;
    offline?: boolean;
    success?: boolean;
  }>;
  readOnly?: boolean;
};

export function ChecklistManager({
  audit,
  nonConformities = [],
  offlineNcItemIds = [],
  onPersistItem,
  readOnly = false,
}: ChecklistManagerProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  // ESC handler for fullscreen
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && fullscreen) {
        setFullscreen(false);
      }
    };

    if (fullscreen) {
      window.addEventListener("keydown", handleKeydown);
      return () => window.removeEventListener("keydown", handleKeydown);
    }
  }, [fullscreen]);

  const ncItemIds = new Set([
    ...nonConformities.map((nc) => nc.checklistItemId),
    ...offlineNcItemIds,
  ]);

  if (!audit.checklists || !audit.checklists.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-8 text-sm text-zinc-500 shadow-sm text-center">
        No checklists configured for this audit.
      </div>
    );
  }

  const allItems = audit.checklists.flatMap((c) => c.items || []);
  const totalItems = allItems.length;
  const answeredItems = allItems.filter(
    (item) => (item.outcome as AuditOutcome | null) && (item.outcome as AuditOutcome) !== "pending"
  ).length;
  const progressPercent = totalItems === 0 ? 0 : Math.round((answeredItems / totalItems) * 100);

  const allItemsWithChecklist = audit.checklists.flatMap((checklist) =>
    (checklist.items || []).map((item, idx) => ({
      ...item,
      checklistId: checklist.id,
      checklistTitle: checklist.title,
      itemIndex: idx + 1,
    }))
  );

  // U2: Progress bar color and feedback based on completion %
  const progressBarColor =
    progressPercent < 50 ? "bg-red-500" :
    progressPercent < 80 ? "bg-amber-500" :
    "bg-green-500";

  const progressFeedback =
    progressPercent < 50 ? "Appena iniziato" :
    progressPercent < 80 ? "A metà strada" :
    "Quasi finito!";

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
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-zinc-900">{progressPercent}%</p>
              <p className="text-xs text-zinc-600 mt-1">{progressFeedback}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:flex items-center gap-1.5"
              onClick={() => setFullscreen(true)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Vista completa
            </Button>
          </div>
        </div>
        <div className="w-full bg-zinc-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${progressBarColor}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
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
              <th className="px-3 py-3 text-center font-semibold text-zinc-700 w-16">Media</th>
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
                  hasNc={ncItemIds.has(item.id) || item.outcome === "non_compliant"}
                  onSelect={() => setSelectedItemId(item.id)}
                  path={`/audits/${audit.id}`}
                  persistItem={onPersistItem}
                  readOnly={readOnly}
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

      {/* FULLSCREEN OVERLAY */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 shadow-sm">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold">{audit.title || "Checklists"}</h2>
              {audit.checklists?.[0]?.title && (
                <span className="text-sm text-gray-500">{audit.checklists[0].title}</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFullscreen(false)}
              className="gap-1"
            >
              <X className="h-4 w-4 mr-1" />
              Chiudi
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-8">#</th>
                    <th className="px-3 py-3 text-left font-semibold text-zinc-700">Question</th>
                    <th className="px-3 py-3 text-center font-semibold text-zinc-700 w-16">OK</th>
                    <th className="px-3 py-3 text-center font-semibold text-zinc-700 w-16">NOK</th>
                    <th className="px-3 py-3 text-center font-semibold text-zinc-700 w-16">N/A</th>
                    <th className="px-3 py-3 text-left font-semibold text-zinc-700 flex-1">Notes</th>
                    <th className="px-3 py-3 text-center font-semibold text-zinc-700 w-16">Media</th>
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
                        hasNc={ncItemIds.has(item.id) || item.outcome === "non_compliant"}
                        onSelect={() => setSelectedItemId(item.id)}
                        path={`/audits/${audit.id}`}
                        persistItem={onPersistItem}
                        readOnly={readOnly}
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
          </div>
        </div>
      )}
    </div>
  );
}
