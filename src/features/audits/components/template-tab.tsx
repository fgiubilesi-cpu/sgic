"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Edit2,
  FileText,
  FolderOpen,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { AuditWithChecklists } from "@/features/audits/queries/get-audit";
import type { TemplateWithDetails } from "@/features/audits/types/templates";
import {
  deleteTemplate,
  duplicateTemplate,
  switchAuditTemplate,
} from "@/features/audits/actions/template-actions";
import { EditTemplateSheet } from "./edit-template-sheet";
import { ImportTemplateSheet } from "./import-template-sheet";

interface TemplateTabProps {
  audit: AuditWithChecklists;
  templates: TemplateWithDetails[];
  readOnly?: boolean;
}

export function TemplateTab({ audit, templates, readOnly = false }: TemplateTabProps) {
  const router = useRouter();
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [switchSheetOpen, setSwitchSheetOpen] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeTemplateId =
    audit.template_id ?? audit.checklists.find((checklist) => checklist.template_id)?.template_id ?? null;
  const activeTemplate =
    (activeTemplateId ? templates.find((template) => template.id === activeTemplateId) : null) ?? null;
  const totalQuestions = audit.checklists.reduce(
    (total, checklist) => total + (checklist.items?.length ?? 0),
    0
  );

  const runTemplateAction = (templateId: string, action: () => Promise<void>) => {
    setPendingTemplateId(templateId);
    startTransition(async () => {
      try {
        await action();
      } finally {
        setPendingTemplateId((currentValue) => (currentValue === templateId ? null : currentValue));
      }
    });
  };

  const handleDuplicateTemplate = (template: TemplateWithDetails) => {
    runTemplateAction(template.id, async () => {
      const result = await duplicateTemplate(template.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Template duplicato.");
      router.push(`/templates/${result.id}`);
      router.refresh();
    });
  };

  const handleDeleteTemplate = (template: TemplateWithDetails) => {
    if (!window.confirm(`Eliminare il template "${template.title}"?`)) {
      return;
    }

    runTemplateAction(template.id, async () => {
      const result = await deleteTemplate(template.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Template eliminato.");
      router.refresh();
    });
  };

  const handleSwitchTemplate = (template: TemplateWithDetails) => {
    if (template.id === activeTemplateId) {
      setSwitchSheetOpen(false);
      return;
    }

    runTemplateAction(template.id, async () => {
      const result = await switchAuditTemplate({
        auditId: audit.id,
        templateId: template.id,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Template audit aggiornato.");
      setSwitchSheetOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <EditTemplateSheet
        templateId={editingTemplateId ?? ""}
        open={editSheetOpen}
        onOpenChange={(nextOpen) => {
          setEditSheetOpen(nextOpen);
          if (!nextOpen) {
            setEditingTemplateId(null);
          }
        }}
        onSaved={() => {
          router.refresh();
        }}
      />

      <Sheet open={switchSheetOpen} onOpenChange={setSwitchSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Cambia template audit</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Il cambio template e consentito solo su audit ancora pianificati e senza risposte,
              note, evidenze o non conformita.
            </div>

            <div className="space-y-3">
              {templates.map((template) => {
                const isActive = template.id === activeTemplateId;
                const isBusy = isPending && pendingTemplateId === template.id;

                return (
                  <div
                    key={template.id}
                    className={`rounded-xl border p-4 ${
                      isActive ? "border-blue-300 bg-blue-50" : "border-zinc-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-zinc-900">{template.title}</div>
                          {isActive ? (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                              Attivo
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-zinc-600">
                          {template.description ?? "Nessuna descrizione disponibile."}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 font-medium text-zinc-700">
                            {template.questionCount} domande
                          </span>
                          <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-medium text-zinc-600">
                            {template.clientName ? `Cliente: ${template.clientName}` : "Globale"}
                          </span>
                        </div>
                      </div>

                      <Button
                        variant={isActive ? "outline" : "default"}
                        size="sm"
                        disabled={isBusy}
                        onClick={() => handleSwitchTemplate(template)}
                      >
                        {isBusy ? "Aggiornamento..." : isActive ? "Gia attivo" : "Usa questo"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <div className="space-y-8">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-gradient-to-r from-sky-50 via-cyan-50 to-white px-5 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700">
                  Template attivo
                </div>
                <div className="text-xl font-semibold text-zinc-900">
                  {activeTemplate?.title ?? "Template non collegato"}
                </div>
                <p className="max-w-3xl text-sm text-zinc-600">
                  {activeTemplate?.description ??
                    "Questo audit non espone ancora un template attivo leggibile. Selezionane uno dalla libreria per riallineare la checklist."}
                </p>
                <div className="flex flex-wrap gap-2 pt-1 text-xs">
                  <span className="rounded-full border border-sky-200 bg-white px-2.5 py-1 font-medium text-sky-800">
                    {totalQuestions} domande snapshot
                  </span>
                  <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-medium text-zinc-600">
                    {audit.checklists.length} checklist collegate
                  </span>
                  {activeTemplate ? (
                    <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-medium text-zinc-600">
                      {activeTemplate.clientName ? `Cliente: ${activeTemplate.clientName}` : "Globale"}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <ImportTemplateSheet
                  templates={templates.map((template) => ({
                    id: template.id,
                    title: template.title,
                  }))}
                />
                <Button variant="outline" asChild>
                  <Link href="/templates">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Apri libreria
                  </Link>
                </Button>

                {!readOnly && activeTemplate ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingTemplateId(activeTemplate.id);
                      setEditSheetOpen(true);
                    }}
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Modifica template
                  </Button>
                ) : null}

                {!readOnly ? (
                  <Button onClick={() => setSwitchSheetOpen(true)}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Cambia template
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {audit.checklists.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <FileText className="mx-auto mb-3 h-9 w-9 text-zinc-300" />
              <p className="text-sm text-zinc-500">
                Nessuna checklist presente. Collega un template per generare le domande.
              </p>
            </div>
          ) : (
            <div className="space-y-4 p-5">
              {audit.checklists.map((checklist, checklistIndex) => {
                const checklistTemplate =
                  (checklist.template_id
                    ? templates.find((template) => template.id === checklist.template_id)
                    : null) ?? null;

                return (
                  <div
                    key={checklist.id}
                    className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                  >
                    <div className="border-b border-zinc-200 bg-white px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">
                            {checklist.title ?? `Checklist ${checklistIndex + 1}`}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {checklist.items.length} domande in snapshot per questo audit
                          </div>
                        </div>
                        {checklistTemplate ? (
                          <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-600">
                            Origine: {checklistTemplate.title}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <ol className="divide-y divide-zinc-200">
                      {checklist.items.map((item, itemIndex) => (
                        <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-700">
                            {itemIndex + 1}
                          </span>
                          <p className="text-sm leading-snug text-zinc-700">{item.question}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!readOnly ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Libreria template</h2>
                <p className="text-sm text-zinc-600">
                  Scegli il modello di riferimento, duplicalo o modificalo senza uscire
                  dall&apos;audit.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href="/templates">
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Vai alla libreria
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/templates/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo template
                  </Link>
                </Button>
              </div>
            </div>

            {templates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
                Nessun template disponibile. Crea un template o importane uno da Excel dalla libreria.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => {
                  const isActive = template.id === activeTemplateId;
                  const isBusy = isPending && pendingTemplateId === template.id;

                  return (
                    <div
                      key={template.id}
                      className={`overflow-hidden rounded-2xl border shadow-sm ${
                        isActive ? "border-blue-300 bg-blue-50" : "border-zinc-200 bg-white"
                      }`}
                    >
                      <div
                        className={`border-b px-4 py-3 ${
                          isActive
                            ? "border-blue-200 bg-gradient-to-r from-blue-100 to-blue-50"
                            : "border-zinc-200 bg-zinc-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="text-sm font-semibold text-zinc-900">{template.title}</div>
                            <p className="text-sm text-zinc-600">
                              {template.description ?? "Nessuna descrizione disponibile."}
                            </p>
                          </div>
                          {isActive ? (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                              Attivo
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-medium text-zinc-700">
                            {template.questionCount} domande
                          </span>
                          <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 font-medium text-zinc-600">
                            {template.clientName ? `Cliente: ${template.clientName}` : "Globale"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-4">
                        <Button
                          variant={isActive ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleSwitchTemplate(template)}
                          disabled={isActive || isBusy}
                          className="col-span-2"
                        >
                          {isBusy ? "Aggiornamento..." : isActive ? "Template attivo" : "Usa su questo audit"}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingTemplateId(template.id);
                            setEditSheetOpen(true);
                          }}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Modifica
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicateTemplate(template)}
                          disabled={isBusy}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Duplica
                        </Button>

                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/templates/${template.id}`}>Apri</Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteTemplate(template)}
                          disabled={isBusy || isActive}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Elimina
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
}
