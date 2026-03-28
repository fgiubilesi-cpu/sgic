"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, Plus, AlertTriangle, Calendar, User, Edit2, FileText, Trash2
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
  deleteCorrectiveAction,
} from "@/features/audits/actions/corrective-action-actions";
import { updateNonConformity } from "@/features/audits/actions/non-conformity-actions";
import { NCDocumentsPanel } from "@/features/audits/components/nc-documents-panel";
import {
  countOpenCorrectiveActions,
  countOverdueCorrectiveActions,
  getNonConformityActionSummary,
  getNonConformityOverviewMetrics,
} from "@/features/quality/lib/quality-process";
import {
  toCanonicalCorrectiveAction,
  toCanonicalNonConformity,
  toProcessCorrectiveActionShape,
} from "@/features/quality/lib/nc-ac-contract";

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

      <p className="text-xs text-zinc-500">
        Per la gestione operativa bastano azione, responsabile e data obiettivo. I dettagli estesi restano opzionali.
      </p>

      <div>
        <label className="text-xs font-medium text-zinc-600 mb-1 block">
          Descrizione <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrizione dell'azione..."
          rows={3}
          className="w-full text-xs border border-zinc-300 rounded px-2 py-1 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-500"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
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

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-zinc-700">
          Dettagli opzionali
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1 block">Piano d&apos;azione</label>
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
        </div>
      </details>

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

      <p className="text-xs text-zinc-500">
        Vista audit orientata all&apos;azione: raccogli prima il minimo operativo, aggiungi il resto solo se serve.
      </p>

      <div>
        <label className="text-xs font-medium text-zinc-600 mb-1 block">
          Descrizione <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrizione dell'azione..."
          rows={3}
          className="w-full text-xs border border-zinc-300 rounded px-2 py-1 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-500"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
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

      <details className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2">
        <summary className="cursor-pointer text-xs font-medium text-zinc-700">
          Dettagli opzionali
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-zinc-600 mb-1 block">Piano d&apos;azione</label>
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
        </div>
      </details>

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
    const canonicalNc = toCanonicalNonConformity({
      ...nc,
      correctiveActions: correctiveActions.filter((ca) => ca.nonConformityId === nc.id),
    });
    const processActions = canonicalNc.correctiveActions.map(toProcessCorrectiveActionShape);
    const severity = (nc.severity as string).toUpperCase();
    const status = NC_STATUS_LABELS[nc.status as keyof typeof NC_STATUS_LABELS] || nc.status;
    const summary = getNonConformityActionSummary({
      corrective_actions: processActions,
      severity: canonicalNc.severity,
    });
    const openActions = countOpenCorrectiveActions(processActions);
    const activeOwner = canonicalNc.correctiveActions.find((action) => action.status !== "completed")?.responsiblePersonName;

    report += `NC #${index + 1} — ${severity} — Stato: ${status}\n`;
    report += `Domanda: ${nc.checklistItem?.question || canonicalNc.title || "NC"}\n`;

    if (canonicalNc.description) {
      report += `Descrizione: ${canonicalNc.description}\n`;
    }

    report += `Presa in carico: ${summary.label}\n`;
    if (summary.detail) {
      report += `Dettaglio: ${summary.detail}\n`;
    }
    if (openActions > 0) {
      report += `Azioni aperte: ${openActions}\n`;
    }
    if (activeOwner) {
      report += `Responsabile attivo: ${activeOwner}\n`;
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
    } catch {
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
  const [deletingCaId, setDeletingCaId] = useState<string | null>(null);
  const [updatingNcStatusId, setUpdatingNcStatusId] = useState<string | null>(null);

  const reportText = generateNcAcReport(audit, nonConformities, correctiveActions);
  const overviewMetrics = getNonConformityOverviewMetrics(
    nonConformities.map((nc) =>
      toCanonicalNonConformity({
        ...nc,
        correctiveActions: correctiveActions.filter((ca) => ca.nonConformityId === nc.id),
      })
    ).map((nc) => ({
      corrective_actions: nc.correctiveActions.map(toProcessCorrectiveActionShape),
      severity: nc.severity,
    }))
  );
  const overdueCorrectiveActions = correctiveActions.filter(
    (ca) => ca.status !== "completed" && isDueDateOverdue(ca.dueDate ?? ca.targetCompletionDate ?? null)
  ).length;

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
              Non Conformità e Azioni Correttive
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Vista di controllo audit: priorità, avanzamento e ritardi delle azioni correttive.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="bg-zinc-100 text-zinc-700 border-0">{overviewMetrics.total} NC</Badge>
              <Badge className="bg-red-100 text-red-700 border-0">{overviewMetrics.critical} critiche</Badge>
              <Badge className="bg-amber-100 text-amber-700 border-0">{overviewMetrics.unplanned} senza piano</Badge>
              <Badge className="bg-red-50 text-red-700 border border-red-100">{overdueCorrectiveActions} AC in ritardo</Badge>
            </div>
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
              const actionSummary = getNonConformityActionSummary({
                corrective_actions: ncCas.map((ca) => toProcessCorrectiveActionShape(toCanonicalCorrectiveAction(ca))),
                severity: nc.severity,
              });
              const openActions = countOpenCorrectiveActions(
                ncCas.map((ca) => toProcessCorrectiveActionShape(toCanonicalCorrectiveAction(ca)))
              );
              const overdueActions = countOverdueCorrectiveActions(
                ncCas.map((ca) => toProcessCorrectiveActionShape(toCanonicalCorrectiveAction(ca)))
              );

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
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-700 truncate">{actionSummary.label}</p>
                        {actionSummary.detail ? (
                          <p className="text-[11px] text-zinc-500 truncate">{actionSummary.detail}</p>
                        ) : null}
                      </div>
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
                            setExpandedNcId(nc.id);
                            setAddingCaForNcId(nc.id);
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
                        <div className="space-y-4">
                        <div className="grid gap-6 lg:grid-cols-2">
                          {/* NC EDIT FORM */}
                          <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2">
                            <h4 className="text-sm font-semibold text-zinc-700">Contesto NC</h4>
                            {nc.checklistItem?.question ? (
                              <div>
                                <label className="text-xs font-medium text-zinc-600 block mb-1">Domanda audit</label>
                                <p className="text-sm text-zinc-800 leading-relaxed">{nc.checklistItem.question}</p>
                              </div>
                            ) : null}
                            <div>
                              <label className="text-xs font-medium text-zinc-600 block mb-1">Descrizione</label>
                              <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 leading-relaxed">
                                {nc.description || "Nessuna descrizione operativa disponibile."}
                              </p>
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
                                {readOnly ? (
                                  <Badge className={cn("text-xs", NC_STATUS_COLORS[status])}>
                                    {NC_STATUS_LABELS[status]}
                                  </Badge>
                                ) : (
                                  <select
                                    defaultValue={nc.status}
                                    disabled={updatingNcStatusId === nc.id}
                                    onChange={async (e) => {
                                      setUpdatingNcStatusId(nc.id);
                                      const result = await updateNonConformity({
                                        id: nc.id,
                                        status: e.target.value as "open" | "pending_verification" | "closed",
                                      });
                                      setUpdatingNcStatusId(null);
                                      if (result.success) {
                                        toast.success("Stato NC aggiornato.");
                                      } else {
                                        toast.error(result.error || "Errore aggiornamento stato.");
                                      }
                                    }}
                                    className="w-full text-xs border border-zinc-300 rounded px-2 py-1 focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
                                  >
                                    <option value="open">Aperta</option>
                                    <option value="pending_verification">In verifica</option>
                                    <option value="closed">Chiusa</option>
                                  </select>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* AC SECTION */}
                          <div className="space-y-3">
                            <div className="grid gap-2 sm:grid-cols-3">
                              <div className="rounded-lg border bg-white px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Aperte</p>
                                <p className="text-lg font-semibold text-zinc-900">{openActions}</p>
                              </div>
                              <div className="rounded-lg border bg-white px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide text-zinc-500">In ritardo</p>
                                <p className="text-lg font-semibold text-red-600">{overdueActions}</p>
                              </div>
                              <div className="rounded-lg border bg-white px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wide text-zinc-500">Totali</p>
                                <p className="text-lg font-semibold text-zinc-900">{ncCas.length}</p>
                              </div>
                            </div>

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
                                      className={cn(
                                        "rounded-lg border border-zinc-200 bg-white p-3 transition",
                                        overdue && ca.status !== "completed" ? "border-red-200 bg-red-50/40" : ""
                                      )}
                                    >
                                      <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 space-y-1">
                                          <p className="text-sm font-medium text-zinc-900">{ca.description}</p>
                                          {ca.actionPlan ? (
                                            <p className="text-xs text-zinc-500 line-clamp-2">{ca.actionPlan}</p>
                                          ) : null}
                                        </div>
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
                                                disabled={deletingCaId === ca.id}
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  if (!confirm("Eliminare questa azione correttiva?")) return;
                                                  setDeletingCaId(ca.id);
                                                  const result = await deleteCorrectiveAction(ca.id);
                                                  setDeletingCaId(null);
                                                  if (result.success) {
                                                    toast.success("Azione correttiva eliminata.");
                                                  } else {
                                                    toast.error(result.error || "Errore eliminazione AC.");
                                                  }
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
                              !readOnly && (
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

                        {/* DOCUMENTI COLLEGATI */}
                        <NCDocumentsPanel
                          nonConformityId={nc.id}
                          readOnly={readOnly}
                        />
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
