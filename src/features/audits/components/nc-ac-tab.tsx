"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, Plus, AlertTriangle, Calendar, User, Edit2, FileText, Trash2, Check, X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AuditWithChecklists } from "@/features/audits/queries/get-audit";
import type { NonConformity } from "@/features/audits/queries/get-non-conformities";
import type { CorrectiveAction } from "@/features/audits/queries/get-corrective-actions";
import {
  NC_SEVERITY_LABELS,
  NC_SEVERITY_COLORS,
  NC_STATUS_LABELS,
  NC_STATUS_COLORS,
  CA_STATUS_LABELS,
  CA_STATUS_COLORS,
} from "@/features/quality/constants";
import {
  createCorrectiveAction,
  updateCorrectiveAction,
} from "@/features/audits/actions/corrective-action-actions";

interface NcAcTabProps {
  audit: AuditWithChecklists;
  nonConformities: NonConformity[];
  correctiveActions: CorrectiveAction[];
  readOnly?: boolean;
}

// ============================================
// UTILITY: Date checks
// ============================================

function isDueDateOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return due < today;
}

// ============================================
// EDIT CA FORM
// ============================================

interface EditCaFormProps {
  ca: CorrectiveAction;
  onSuccess: () => void;
  onCancel: () => void;
}

function EditCaForm({ ca, onSuccess, onCancel }: EditCaFormProps) {
  const [description, setDescription] = useState(ca.description);
  const [actionPlan, setActionPlan] = useState(ca.actionPlan ?? "");
  const [rootCause, setRootCause] = useState(ca.rootCause ?? "");
  const [responsiblePersonName, setResponsiblePersonName] = useState(ca.responsiblePersonName ?? "");
  const [responsiblePersonEmail, setResponsiblePersonEmail] = useState(ca.responsiblePersonEmail ?? "");
  const [dueDate, setDueDate] = useState(ca.dueDate ? ca.dueDate.split("T")[0] : "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("La descrizione dell'azione è obbligatoria.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateCorrectiveAction({
        id: ca.id,
        description: description.trim(),
        actionPlan: actionPlan.trim() || undefined,
        rootCause: rootCause.trim() || undefined,
        responsiblePersonName: responsiblePersonName.trim() || undefined,
        responsiblePersonEmail: responsiblePersonEmail.trim() || undefined,
        dueDate: dueDate || undefined,
      });

      if (result.success) {
        toast.success("Azione correttiva aggiornata.");
        onSuccess();
      } else {
        toast.error(result.error || "Errore durante l'aggiornamento.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h4 className="text-sm font-semibold text-zinc-700">Modifica Azione Correttiva</h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">
            Descrizione <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrizione dell'azione..."
            rows={2}
            className="w-full text-xs border border-zinc-300 rounded px-2 py-1 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Piano d'azione</label>
          <textarea
            value={actionPlan}
            onChange={(e) => setActionPlan(e.target.value)}
            placeholder="Dettagli del piano..."
            rows={2}
            className="w-full text-xs border border-zinc-300 rounded px-2 py-1 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Causa radice</label>
          <Input
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="Analisi..."
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Responsabile</label>
          <Input
            value={responsiblePersonName}
            onChange={(e) => setResponsiblePersonName(e.target.value)}
            placeholder="Nome"
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Email</label>
          <Input
            type="email"
            value={responsiblePersonEmail}
            onChange={(e) => setResponsiblePersonEmail(e.target.value)}
            placeholder="email@example.com"
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Scadenza</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
          Annulla
        </Button>
        <Button type="submit" size="sm" disabled={isLoading} className="bg-zinc-900 text-white">
          {isLoading ? "Salvataggio..." : "Salva AC"}
        </Button>
      </div>
    </form>
  );
}

// ============================================
// ADD CA FORM
// ============================================

interface AddCaFormProps {
  ncId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddCaForm({ ncId, onSuccess, onCancel }: AddCaFormProps) {
  const [description, setDescription] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [responsiblePersonName, setResponsiblePersonName] = useState("");
  const [responsiblePersonEmail, setResponsiblePersonEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("La descrizione dell'azione è obbligatoria.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCorrectiveAction({
        nonConformityId: ncId,
        description: description.trim(),
        rootCause: rootCause.trim() || undefined,
        actionPlan: actionPlan.trim() || undefined,
        responsiblePersonName: responsiblePersonName.trim() || undefined,
        responsiblePersonEmail: responsiblePersonEmail.trim() || undefined,
        targetCompletionDate: dueDate || undefined,
      });

      if (result.success) {
        toast.success("Azione correttiva aggiunta.");
        onSuccess();
      } else {
        toast.error(result.error || "Errore durante il salvataggio.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h4 className="text-sm font-semibold text-zinc-700">Nuova Azione Correttiva</h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">
            Descrizione <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrizione dell'azione..."
            rows={2}
            className="w-full text-xs border border-zinc-300 rounded px-2 py-1 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Piano d'azione</label>
          <textarea
            value={actionPlan}
            onChange={(e) => setActionPlan(e.target.value)}
            placeholder="Dettagli del piano..."
            rows={2}
            className="w-full text-xs border border-zinc-300 rounded px-2 py-1 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-500"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Causa radice</label>
          <Input
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="Analisi..."
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Responsabile</label>
          <Input
            value={responsiblePersonName}
            onChange={(e) => setResponsiblePersonName(e.target.value)}
            placeholder="Nome"
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Email</label>
          <Input
            type="email"
            value={responsiblePersonEmail}
            onChange={(e) => setResponsiblePersonEmail(e.target.value)}
            placeholder="email@example.com"
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Scadenza</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isLoading}>
          Annulla
        </Button>
        <Button type="submit" size="sm" disabled={isLoading} className="bg-zinc-900 text-white">
          {isLoading ? "Salvataggio..." : "Salva AC"}
        </Button>
      </div>
    </form>
  );
}

// ============================================
// REPORT GENERATOR
// ============================================

function generateNcAcReport(
  audit: AuditWithChecklists,
  nonConformities: NonConformity[],
  correctiveActions: CorrectiveAction[]
): string {
  const clientName = audit.client_name || "N/A";
  const locationName = audit.location_name || "N/A";
  const auditDate = audit.scheduled_date
    ? new Intl.DateTimeFormat("it-IT").format(new Date(audit.scheduled_date))
    : "N/A";

  let report = "RIEPILOGO NON CONFORMITÀ E AZIONI CORRETTIVE\n";
  report += `Audit: ${audit.title} — ${clientName} — ${locationName} — ${auditDate}\n`;
  report += `Totale NC: ${nonConformities.length} | AC registrate: ${correctiveActions.length}\n`;
  report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  nonConformities.forEach((nc, index) => {
    const severity = (nc.severity as string).toUpperCase();
    const status = NC_STATUS_LABELS[nc.status as keyof typeof NC_STATUS_LABELS] || nc.status;

    report += `NC #${index + 1} — ${severity} — Stato: ${status}\n`;
    report += `Domanda: ${nc.checklistItem?.question || nc.title}\n`;

    if (nc.description) {
      report += `Descrizione: ${nc.description}\n`;
    }

    const ncCas = correctiveActions.filter((ca) => ca.nonConformityId === nc.id);

    if (ncCas.length > 0) {
      ncCas.forEach((ca) => {
        report += `  → Azione Correttiva:\n`;
        report += `     ${ca.description}\n`;

        if (ca.responsiblePersonName) {
          report += `     Responsabile: ${ca.responsiblePersonName}\n`;
        }

        if (ca.dueDate) {
          const caDate = new Intl.DateTimeFormat("it-IT").format(new Date(ca.dueDate));
          report += `     Scadenza: ${caDate}\n`;
        }

        const caStatus = CA_STATUS_LABELS[ca.status as keyof typeof CA_STATUS_LABELS] || ca.status;
        report += `     Stato: ${caStatus}\n`;
      });
    } else {
      report += `  → Nessuna azione correttiva registrata.\n`;
    }

    report += "\n";
  });

  report += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

  return report;
}

// ============================================
// REPORT MODAL
// ============================================

interface ReportModalProps {
  isOpen: boolean;
  reportText: string;
  onClose: () => void;
}

function ReportModal({ isOpen, reportText, onClose }: ReportModalProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      toast.success("Report copiato negli appunti!");
    } catch (error) {
      toast.error("Errore durante la copia.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-96">
        <DialogHeader>
          <DialogTitle>Report NC/AC</DialogTitle>
        </DialogHeader>
        <textarea
          value={reportText}
          readOnly
          className="w-full h-64 text-xs border border-zinc-300 rounded p-3 bg-zinc-50 font-mono resize-none focus:ring-1 focus:ring-zinc-500"
        />
        <DialogFooter className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1"
          >
            Copia negli appunti
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Chiudi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN TAB COMPONENT
// ============================================

export function NcAcTab({ audit, nonConformities, correctiveActions, readOnly = false }: NcAcTabProps) {
  const [expandedNcId, setExpandedNcId] = useState<string | null>(null);
  const [editingCaId, setEditingCaId] = useState<string | null>(null);
  const [addingCaForNcId, setAddingCaForNcId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const reportText = generateNcAcReport(audit, nonConformities, correctiveActions);

  if (nonConformities.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
        <AlertTriangle className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">
          Nessuna non conformità registrata per questo audit.
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Le NC vengono create automaticamente quando un item viene marcato come non conforme.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-4 py-4 border-b border-zinc-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
              Non Conformità e Azioni Correttive
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {nonConformities.length} NC trovate · {correctiveActions.length} AC registrate
            </p>
          </div>
          {!readOnly && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReportOpen(true)}
              className="gap-2"
            >
              <FileText className="w-4 h-4" />
              Genera Report
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-8"></th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-20">Severità</th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-24">Stato NC</th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 flex-1 min-w-0">
                Non Conformità
              </th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 flex-1 min-w-0">
                Azione Correttiva
              </th>
              <th className="px-3 py-3 text-right font-semibold text-zinc-700 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {nonConformities.map((nc) => {
              const ncCas = correctiveActions.filter((ca) => ca.nonConformityId === nc.id);
              const severity = nc.severity as keyof typeof NC_SEVERITY_LABELS;
              const status = nc.status as keyof typeof NC_STATUS_LABELS;
              const isExpanded = expandedNcId === nc.id;

              return (
                <React.Fragment key={nc.id}>
                  {/* NC ROW */}
                  <tr
                    onClick={() => !readOnly && setExpandedNcId(isExpanded ? null : nc.id)}
                    className={cn(
                      "h-11 border-b border-zinc-200 transition-colors group",
                      !readOnly && "hover:bg-blue-50 cursor-pointer"
                    )}
                  >
                    {/* Espandi */}
                    <td className="px-3 py-0 text-zinc-400 text-center">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 inline" />
                      ) : (
                        <ChevronRight className="w-4 h-4 inline" />
                      )}
                    </td>

                    {/* Severità */}
                    <td className="px-3 py-0">
                      <Badge className={cn("text-xs", NC_SEVERITY_COLORS[severity])}>
                        {NC_SEVERITY_LABELS[severity]}
                      </Badge>
                    </td>

                    {/* Stato NC */}
                    <td className="px-3 py-0">
                      <Badge className={cn("text-xs", NC_STATUS_COLORS[status])}>
                        {NC_STATUS_LABELS[status]}
                      </Badge>
                    </td>

                    {/* Non Conformità */}
                    <td className="px-3 py-0 min-w-0">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xs text-zinc-900 truncate">
                          {nc.title ? `${nc.title} - ` : ""}
                          {nc.checklistItem?.question || "N/A"}
                        </span>
                        {ncCas.length > 0 && (
                          <Badge className="text-xs bg-amber-100 text-amber-700 border-0 shrink-0">
                            {ncCas.length} AC
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Azione Correttiva */}
                    <td className="px-3 py-0 min-w-0">
                      {ncCas.length > 0 ? (
                        <div className="flex items-center gap-1 truncate">
                          <span className="text-xs text-zinc-600 truncate">
                            {ncCas[0]?.description || "N/A"}
                          </span>
                          {ncCas.length > 1 && (
                            <span className="text-xs text-zinc-400 shrink-0">+{ncCas.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Nessuna AC</span>
                      )}
                    </td>

                    {/* Azioni */}
                    <td className="px-3 py-0 text-right shrink-0">
                      {!readOnly && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddingCaForNcId(ncCas.length === 0 ? nc.id : null);
                          }}
                          className={cn(
                            "gap-1 text-xs transition-opacity",
                            readOnly ? "opacity-0 cursor-not-allowed" : "opacity-0 group-hover:opacity-100"
                          )}
                          title={readOnly ? "Modalità sola lettura" : "Aggiungi AC"}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>

                  {/* EXPANDED SECTION */}
                  {isExpanded && (
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-6">
                          {/* NC EDIT FORM */}
                          <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2">
                            <h4 className="text-sm font-semibold text-zinc-700">Non Conformità</h4>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 block mb-1">Titolo</label>
                              <Input
                                value={nc.title || ""}
                                readOnly
                                className="text-xs h-8 bg-zinc-100"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-zinc-600 block mb-1">Descrizione</label>
                              <Textarea
                                value={nc.description || ""}
                                readOnly
                                rows={2}
                                className="text-xs bg-zinc-100"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs font-medium text-zinc-600 block mb-1">Severità</label>
                                <Badge className={cn("text-xs", NC_SEVERITY_COLORS[severity])}>
                                  {NC_SEVERITY_LABELS[severity]}
                                </Badge>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-zinc-600 block mb-1">Stato</label>
                                <Badge className={cn("text-xs", NC_STATUS_COLORS[status])}>
                                  {NC_STATUS_LABELS[status]}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* AC SECTION */}
                          <div className="space-y-3">
                            {ncCas.map((ca) => {
                              const isEditingCa = editingCaId === ca.id;
                              const overdue = ca.dueDate ? isDueDateOverdue(ca.dueDate) : false;
                              const caStatus = ca.status as keyof typeof CA_STATUS_LABELS;

                              return (
                                <React.Fragment key={ca.id}>
                                  {isEditingCa ? (
                                    <div className="rounded-lg border border-zinc-200 bg-white p-3">
                                      <EditCaForm
                                        ca={ca}
                                        onSuccess={() => {
                                          setEditingCaId(null);
                                        }}
                                        onCancel={() => setEditingCaId(null)}
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => !readOnly && setEditingCaId(ca.id)}
                                      className={cn(
                                        "rounded-lg border border-zinc-200 bg-white p-3 cursor-pointer transition hover:shadow-sm",
                                        !readOnly && "hover:border-blue-300"
                                      )}
                                    >
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <p className="text-xs text-zinc-800 flex-1">{ca.description}</p>
                                        <div className="flex gap-1 shrink-0">
                                          {!readOnly && (
                                            <>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingCaId(ca.id);
                                                }}
                                                className="h-6 px-1.5 text-xs"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </Button>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  // TODO: Implement delete AC
                                                  toast.info("Delete AC: implementazione in corso");
                                                }}
                                                className="h-6 px-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </Button>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 flex-wrap text-xs">
                                        {ca.responsiblePersonName && (
                                          <span className="flex items-center gap-0.5 text-zinc-600">
                                            <User className="w-3 h-3" />
                                            {ca.responsiblePersonName}
                                          </span>
                                        )}
                                        {ca.dueDate && (
                                          <span className={cn(
                                            "flex items-center gap-0.5",
                                            overdue && ca.status !== "completed" ? "text-red-600 font-semibold" : "text-zinc-600"
                                          )}>
                                            <Calendar className="w-3 h-3" />
                                            {new Intl.DateTimeFormat("it-IT").format(new Date(ca.dueDate))}
                                            {overdue && ca.status !== "completed" && (
                                              <AlertTriangle className="w-3 h-3 text-red-500" />
                                            )}
                                          </span>
                                        )}
                                        <Badge className={cn("text-xs", CA_STATUS_COLORS[caStatus])}>
                                          {CA_STATUS_LABELS[caStatus]}
                                        </Badge>
                                      </div>
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}

                            {addingCaForNcId === nc.id ? (
                              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                                <AddCaForm
                                  ncId={nc.id}
                                  onSuccess={() => {
                                    setAddingCaForNcId(null);
                                  }}
                                  onCancel={() => setAddingCaForNcId(null)}
                                />
                              </div>
                            ) : (
                              ncCas.length === 0 && !readOnly && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAddingCaForNcId(nc.id)}
                                  className="w-full gap-2"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Aggiungi Azione Correttiva
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={reportOpen}
        reportText={reportText}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
