"use client";

import { useState } from "react";
import { FileText, Plus, Edit2, Copy, Trash2, ChevronUp, ChevronDown, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { AuditWithChecklists } from "@/features/audits/queries/get-audit";
import type { TemplateWithDetails } from "@/features/audits/types/templates";
import {
  createTemplate,
  updateTemplate,
  deleteTemplate,
  softDeleteTemplateQuestion,
} from "@/features/audits/actions/template-actions";

interface TemplateTabProps {
  audit: AuditWithChecklists;
  templates: TemplateWithDetails[];
  readOnly?: boolean;
}

type FormQuestion = {
  id?: string;
  question: string;
  sortOrder: number;
};

export function TemplateTab({ audit, templates, readOnly = false }: TemplateTabProps) {
  const [showNewTemplate, setShowNewTemplate] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithDetails | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formQuestions, setFormQuestions] = useState<FormQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [templatesData, setTemplatesData] = useState<TemplateWithDetails[]>(templates);

  // Determine active template (from audit.template_id or first checklist's source)
  const activeTemplateId = (audit as any)?.template_id || null;

  const handleOpenNewTemplate = () => {
    setEditingTemplate(null);
    setFormTitle("");
    setFormDescription("");
    setFormQuestions([]);
    setShowNewTemplate(true);
  };

  const handleOpenEditTemplate = async (template: TemplateWithDetails) => {
    setEditingTemplate(template);
    setFormTitle(template.title);
    setFormDescription(template.description || "");
    // Fetch questions for this template
    setFormQuestions([]); // Will be loaded from DB in a real scenario
    setShowNewTemplate(true);
  };

  const handleSaveTemplate = async () => {
    if (!formTitle.trim()) {
      toast.error("Il titolo del template è obbligatorio");
      return;
    }

    setIsSaving(true);
    try {
      if (editingTemplate) {
        // Update existing template
        const result = await updateTemplate({
          templateId: editingTemplate.id,
          title: formTitle,
          description: formDescription || null,
        });

        if (result.success) {
          toast.success("Template aggiornato");
          setShowNewTemplate(false);
          // Templates will be refreshed from parent page
        } else {
          toast.error(result.error);
        }
      } else {
        // Create new template
        const result = await createTemplate({
          title: formTitle,
          description: formDescription || undefined,
        });

        if (result.success) {
          toast.success("Template creato");
          setShowNewTemplate(false);
          // Templates will be refreshed from parent page
        } else {
          toast.error(result.error);
        }
      }
    } catch (err) {
      console.error("Error saving template:", err);
      toast.error("Errore nel salvataggio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddQuestion = () => {
    const newSortOrder = Math.max(...formQuestions.map((q) => q.sortOrder), 0) + 1;
    setFormQuestions([...formQuestions, { question: "", sortOrder: newSortOrder }]);
  };

  const handleDeleteQuestion = (index: number) => {
    const question = formQuestions[index];
    if (question.id && editingTemplate) {
      // If it's a saved question, soft-delete it from DB
      softDeleteTemplateQuestion(question.id, editingTemplate.id);
    }
    setFormQuestions(formQuestions.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = (index: number, text: string) => {
    const updated = [...formQuestions];
    updated[index].question = text;
    setFormQuestions(updated);
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    const updated = [...formQuestions];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < updated.length) {
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      // Update sort orders
      updated.forEach((q, i) => {
        q.sortOrder = i + 1;
      });
      setFormQuestions(updated);
    }
  };

  const handleDeleteTemplate = async (template: TemplateWithDetails) => {
    if (!confirm(`Elimina il template "${template.title}"?`)) return;

    try {
      const result = await deleteTemplate(template.id);
      if (result.success) {
        toast.success("Template eliminato");
        // Templates will be refreshed from parent page
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error("Error deleting template:", err);
      toast.error("Errore nell'eliminazione");
    }
  };

  const handleDuplicateTemplate = async (template: TemplateWithDetails) => {
    try {
      const result = await createTemplate({
        title: `${template.title} (copia)`,
        description: template.description || undefined,
      });

      if (result.success) {
        toast.success("Template duplicato");
        // Templates will be refreshed from parent page
      } else {
        toast.error(result.error);
      }
    } catch (err) {
      console.error("Error duplicating template:", err);
      toast.error("Errore nella duplicazione");
    }
  };

  const allItems = audit.checklists.flatMap((c) => c.items || []);

  return (
    <div className="space-y-8">
      {/* Section 1: Current Template Associated with Audit */}
      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-4 border-b border-zinc-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Template associato</h2>
              <p className="text-sm text-zinc-600 mt-1">
                {audit.checklists.length > 0
                  ? `${allItems.length} domande in ${audit.checklists.length} checklist`
                  : "Nessun template configurato"}
              </p>
            </div>
            {!readOnly && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    Cambia template
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Seleziona un template</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-2">
                    {templatesData.map((t) => {
                      const isActive = activeTemplateId === t.id;
                      return (
                        <button
                          key={t.id}
                          className={`w-full p-3 rounded-lg border transition text-left ${
                            isActive
                              ? "border-blue-300 bg-blue-50 hover:bg-blue-100"
                              : "border-zinc-200 bg-white hover:bg-zinc-50"
                          }`}
                          onClick={async () => {
                            // TODO: Implement template switching on audit
                            toast.info("Cambio template: implementazione in corso");
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className={`font-medium text-sm ${isActive ? "text-blue-900" : "text-zinc-900"}`}>
                                {t.title}
                              </div>
                              <div className={`text-xs mt-1 ${isActive ? "text-blue-700" : "text-zinc-600"}`}>
                                {t.questionCount} domande
                              </div>
                            </div>
                            {isActive && (
                              <div className="text-xs font-semibold text-blue-700 whitespace-nowrap">● Attivo</div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Display current checklists */}
        {audit.checklists.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Nessun template configurato per questo audit.</p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {audit.checklists.map((checklist) => (
              <div key={checklist.id} className="rounded-lg border border-zinc-100 bg-zinc-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-zinc-200 bg-white">
                  <h3 className="text-sm font-semibold text-zinc-800">{checklist.title ?? "Checklist senza titolo"}</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">{(checklist.items || []).length} domande</p>
                </div>
                <ol className="divide-y divide-zinc-100">
                  {(checklist.items || []).map((item, idx) => (
                    <li key={item.id} className="flex items-start gap-3 px-3 py-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 text-[10px] font-semibold shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <p className="text-sm text-zinc-700 leading-snug">{item.question}</p>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 2: Template Management */}
      {!readOnly && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900">Gestione template</h2>
              <p className="text-sm text-zinc-600 mt-1">{templates.length} template disponibili</p>
            </div>
            <Sheet open={showNewTemplate} onOpenChange={setShowNewTemplate}>
              <SheetTrigger asChild>
                <Button size="sm" className="gap-2" onClick={handleOpenNewTemplate}>
                  <Plus className="w-4 h-4" />
                  Nuovo Template
                </Button>
              </SheetTrigger>
              <SheetContent className="sm:max-w-lg overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{editingTemplate ? "Modifica Template" : "Crea Nuovo Template"}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-zinc-900">Titolo</label>
                    <Input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Es. Audit Caseificio"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-900">Descrizione</label>
                    <Textarea
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Descrizione opzionale..."
                      className="mt-1 resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-zinc-900">Domande</label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleAddQuestion}
                        className="gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Aggiungi
                      </Button>
                    </div>

                    {formQuestions.length > 0 ? (
                      <div className="space-y-2">
                        {formQuestions.map((q, idx) => (
                          <div key={idx} className="flex gap-2 items-start p-2 rounded-lg bg-zinc-50 border border-zinc-200">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveQuestion(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 rounded hover:bg-zinc-200 disabled:opacity-30"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveQuestion(idx, "down")}
                                disabled={idx === formQuestions.length - 1}
                                className="p-1 rounded hover:bg-zinc-200 disabled:opacity-30"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={q.question}
                              onChange={(e) => handleUpdateQuestion(idx, e.target.value)}
                              placeholder="Testo della domanda..."
                              className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(idx)}
                              className="p-1 rounded hover:bg-red-100 text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 italic p-2">Nessuna domanda ancora</p>
                    )}
                  </div>

                  <Button
                    onClick={handleSaveTemplate}
                    disabled={isSaving}
                    className="w-full"
                  >
                    {isSaving ? "Salvataggio..." : editingTemplate ? "Aggiorna Template" : "Crea Template"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Templates Grid */}
          {templatesData.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 py-8 text-center">
              <FileText className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">Nessun template disponibile</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templatesData.map((template) => {
                const isActive = activeTemplateId === template.id;
                return (
                  <div
                    key={template.id}
                    className={`rounded-lg border overflow-hidden shadow-sm hover:shadow-md transition ${
                      isActive
                        ? "border-blue-300 bg-blue-50"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    <div className={`px-4 py-3 border-b ${
                      isActive
                        ? "border-blue-200 bg-gradient-to-r from-blue-100 to-blue-50"
                        : "border-zinc-100 bg-gradient-to-r from-zinc-50 to-zinc-100"
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-sm truncate ${isActive ? "text-blue-900" : "text-zinc-900"}`}>
                            {template.title}
                          </h3>
                          {template.description && (
                            <p className={`text-xs mt-1 line-clamp-2 ${isActive ? "text-blue-700" : "text-zinc-600"}`}>
                              {template.description}
                            </p>
                          )}
                        </div>
                        {isActive && (
                          <span className="text-xs font-bold text-blue-700 whitespace-nowrap">● Attivo</span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          isActive
                            ? "bg-blue-200 text-blue-800 border border-blue-300"
                            : "bg-white border border-zinc-200 text-zinc-700"
                        }`}>
                          {template.questionCount} domande
                        </span>
                        {template.clientName ? (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isActive
                              ? "bg-blue-300 text-blue-900"
                              : "bg-blue-100 text-blue-800"
                          }`}>
                            Per: {template.clientName}
                          </span>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            isActive
                              ? "bg-blue-200 text-blue-800"
                              : "bg-zinc-100 text-zinc-700"
                          }`}>
                            Global
                          </span>
                        )}
                      </div>
                    </div>

                  <div className="px-4 py-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenEditTemplate(template)}
                      className="flex-1 gap-1"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifica
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDuplicateTemplate(template)}
                      className="flex-1 gap-1"
                    >
                      <Copy className="w-4 h-4" />
                      Duplica
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template)}
                      className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
