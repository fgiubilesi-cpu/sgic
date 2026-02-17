"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
// Assicurati che il percorso di importazione del tipo sia corretto per il tuo progetto
// Se ti dà errore su questo import, controlla dove hai definito AuditWithChecklists
import type { AuditWithChecklists } from "@/features/audits/queries/get-audit";
import { ChecklistItem } from "./checklist-item"; // Assumo sia nella stessa cartella

type ChecklistManagerProps = {
  audit: AuditWithChecklists;
};

export function ChecklistManager({ audit }: ChecklistManagerProps) {
  if (!audit.checklists || !audit.checklists.length) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-8 text-sm text-zinc-500 shadow-sm text-center">
        Nessuna checklist configurata per questo audit.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
          Checklists
        </h2>
        <p className="text-sm text-zinc-500">
          Elenco delle checklists e delle relative domande associate a questo audit.
        </p>
      </div>

      <Accordion
        type="single"
        collapsible
        className="w-full space-y-2"
      >
        {audit.checklists.map((checklist) => (
          <AccordionItem
            key={checklist.id}
            value={checklist.id}
            className="border rounded-md px-2"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <span className="text-sm font-medium text-zinc-900">
                {checklist.title ?? "Checklist senza titolo"}
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3 pt-1 px-1">
              {checklist.items && checklist.items.length > 0 ? (
                <div className="space-y-0">
                  {checklist.items.map((item) => (
                    <ChecklistItem 
                      key={item.id} 
                      item={item} 
                      auditId={audit.id} /* <--- ECCO IL PEZZO MANCANTE! */
                    />
                  ))}
                </div>
              ) : (
                <p className="py-2 text-xs text-zinc-500 italic">
                  Nessun elemento presente in questa checklist.
                </p>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}