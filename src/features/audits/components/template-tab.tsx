"use client";

import { FileText, Hash } from "lucide-react";
import type { AuditWithChecklists } from "@/features/audits/queries/get-audit";

interface TemplateTabProps {
  audit: AuditWithChecklists;
}

export function TemplateTab({ audit }: TemplateTabProps) {
  const allItems = audit.checklists.flatMap((c) => c.items || []);

  if (audit.checklists.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
        <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">Nessun template configurato per questo audit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">Template checklist</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          {allItems.length} domande in {audit.checklists.length} checklist
        </p>
      </div>

      {audit.checklists.map((checklist) => (
        <div
          key={checklist.id}
          className="rounded-lg border border-zinc-200 bg-white overflow-hidden"
        >
          {/* Checklist header */}
          <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50">
            <h3 className="text-sm font-semibold text-zinc-800">
              {checklist.title ?? "Checklist senza titolo"}
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              {(checklist.items || []).length} domande
            </p>
          </div>

          {/* Items list */}
          <ol className="divide-y divide-zinc-100">
            {(checklist.items || []).map((item, idx) => (
              <li key={item.id} className="flex items-start gap-3 px-4 py-2.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-100 text-zinc-500 text-[10px] font-semibold shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-sm text-zinc-700 leading-snug">{item.question}</p>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
