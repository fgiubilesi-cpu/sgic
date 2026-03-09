"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import {
  ChevronDown, ChevronRight, Plus, AlertTriangle, Calendar, User, Check, X, Edit2, FileText
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
  createCorrectiveAction, updateCorrectiveAction
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

function isDueSoon(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  const diffMs = due.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= 7;
}

// ============================================
// SUBTAB 1: NON CONFORMITÀ (existing logic)
// ============================================

interface AddCaFormProps {
  nc: NonConformity;
  ncId: string;
  auditId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddCaForm({ nc, ncId, auditId, onSuccess, onCancel }: AddCaFormProps) {
  const [description, setDescription] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
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
        responsiblePersonName: assignedTo.trim() || undefined,
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
    <form onSubmit={handleSubmit} className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-3">
      <div>
        <h4 className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
          Nuova azione correttiva per
        </h4>
        <p className="text-xs text-zinc-600 mt-1">
          <span className="font-medium">NC:</span> {nc.title}
        </p>
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-600 mb-1 block">
          Descrizione dell'azione <span className="text-red-500">*</span>
        </label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrizione dettagliata dell'azione correttiva..."
          className="text-sm h-8"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-600 mb-1 block">Causa radice</label>
        <Input
          value={rootCause}
          onChange={(e) => setRootCause(e.target.value)}
          placeholder="Analisi della causa radice..."
          className="text-sm h-8"
          disabled={isLoading}
        />
      </div>

      <div>
        <label className="text-xs font-medium text-zinc-600 mb-1 block">Piano d'azione</label>
        <Input
          value={actionPlan}
          onChange={(e) => setActionPlan(e.target.value)}
          placeholder="Dettagli del piano d'azione..."
          className="text-sm h-8"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Responsabile</label>
          <Input
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Nome responsabile"
            className="text-sm h-8"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">Scadenza</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-sm h-8"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
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

interface NcRowProps {
  nc: NonConformity;
  cas: CorrectiveAction[];
  auditId: string;
  readOnly?: boolean;
}

function NcRow({ nc, cas, auditId, readOnly = false }: NcRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAddCa, setShowAddCa] = useState(false);

  const severity = nc.severity as keyof typeof NC_SEVERITY_LABELS;
  const status = nc.status as keyof typeof NC_STATUS_LABELS;

  return (
    <>
      <tr
        onClick={() => setExpanded((prev) => !prev)}
        className="h-11 border-b border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer group"
      >
        <td className="px-3 py-0 text-zinc-400 shrink-0 w-8 text-center">
          {expanded ? (
            <ChevronDown className="w-4 h-4 inline" />
          ) : (
            <ChevronRight className="w-4 h-4 inline" />
          )}
        </td>

        <td className="px-3 py-0 w-24">
          <Badge className={cn("text-xs", NC_SEVERITY_COLORS[severity])}>
            {NC_SEVERITY_LABELS[severity]}
          </Badge>
        </td>

        <td className="px-3 py-0 w-32">
          <Badge className={cn("text-xs", NC_STATUS_COLORS[status])}>
            {NC_STATUS_LABELS[status]}
          </Badge>
        </td>

        <td className="px-3 py-0 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 h-full">
            <span className="text-xs text-zinc-900 truncate">
              {nc.checklistItem?.question || nc.title}
            </span>
            {cas.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0 font-medium">
                {cas.length} AC
              </span>
            )}
          </div>
        </td>

        <td className="px-3 py-0 text-right shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={readOnly}
            onClick={(e) => {
              e.stopPropagation();
              setShowAddCa(!showAddCa);
            }}
            className={cn(
              "gap-1 text-xs transition-opacity",
              readOnly ? "opacity-0 cursor-not-allowed" : "opacity-0 group-hover:opacity-100"
            )}
            title={readOnly ? "Modalità sola lettura" : "Aggiungi AC"}
          >
            <Plus className="w-3.5 h-3.5" />
            AC
          </Button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-zinc-100 bg-zinc-50">
          <td colSpan={5} className="px-4 py-3">
            <div className="space-y-2">
              {nc.description && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 mb-1">Descrizione</h4>
                  <p className="text-sm text-zinc-700">{nc.description}</p>
                </div>
              )}

              {cas.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-1.5">
                    Azioni Correttive
                  </h4>
                  <div className="space-y-1.5">
                    {cas.map((ca) => {
                      const overdue = ca.dueDate ? isDueDateOverdue(ca.dueDate) : false;
                      const caStatus = ca.status as keyof typeof CA_STATUS_LABELS;

                      const canAdvanceStatus =
                        (caStatus === "open") || (caStatus === "completed");

                      const nextStatus =
                        caStatus === "open" ? "completed" :
                        caStatus === "completed" ? "verified" :
                        undefined;

                      const handleStatusChange = async () => {
                        if (!nextStatus) return;

                        const result = await updateCorrectiveAction({
                          id: ca.id,
                          status: nextStatus,
                        });

                        if (result.success) {
                          toast.success(`Stato AC cambiato a ${CA_STATUS_LABELS[nextStatus]}`);
                        } else {
                          toast.error(result.error || "Errore durante l'aggiornamento.");
                        }
                      };

                      return (
                        <div
                          key={ca.id}
                          className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="text-xs text-zinc-800">{ca.description}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {ca.responsiblePersonName && (
                                  <span className="flex items-center gap-0.5 text-xs text-zinc-500">
                                    <User className="w-2.5 h-2.5" />
                                    {ca.responsiblePersonName}
                                  </span>
                                )}
                                {ca.dueDate && (
                                  <span
                                    className={cn(
                                      "flex items-center gap-0.5 text-xs",
                                      overdue ? "text-red-600 font-semibold" : "text-zinc-500"
                                    )}
                                  >
                                    <Calendar className="w-2.5 h-2.5" />
                                    {new Intl.DateTimeFormat("it-IT").format(new Date(ca.dueDate))}
                                    {overdue && (
                                      <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge className={cn("text-xs", CA_STATUS_COLORS[caStatus])}>
                                {CA_STATUS_LABELS[caStatus]}
                              </Badge>
                              {canAdvanceStatus && !readOnly && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleStatusChange}
                                  className="gap-0.5 text-xs h-6 px-2"
                                >
                                  <Check className="w-3 h-3" />
                                  Avanti
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {showAddCa ? (
                <AddCaForm
                  nc={nc}
                  ncId={nc.id}
                  auditId={auditId}
                  onSuccess={() => setShowAddCa(false)}
                  onCancel={() => setShowAddCa(false)}
                />
              ) : null}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ============================================
// SUBTAB 2: AZIONI CORRETTIVE (NEW)
// ============================================

interface AcTableProps {
  correctiveActions: CorrectiveAction[];
  nonConformities: NonConformity[];
  auditId: string;
  readOnly?: boolean;
}

function AcTable({ correctiveActions, nonConformities, auditId, readOnly = false }: AcTableProps) {
  const [editingCaId, setEditingCaId] = useState<string | null>(null);

  const handleStatusChange = async (caId: string, newStatus: string) => {
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (newStatus === "completed") {
      updateData.completedAt = new Date().toISOString();
    }

    const result = await updateCorrectiveAction({
      id: caId,
      ...updateData,
    });

    if (result.success) {
      toast.success(`AC cambiata a ${CA_STATUS_LABELS[newStatus as keyof typeof CA_STATUS_LABELS]}`);
    } else {
      toast.error(result.error || "Errore durante l'aggiornamento.");
    }
  };

  const handleQuickClose = async (caId: string) => {
    await handleStatusChange(caId, "completed");
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700">Descrizione</th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-40">NC Collegata</th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-32">Responsabile</th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-32">Scadenza</th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-28">Stato</th>
              <th className="px-3 py-3 text-right font-semibold text-zinc-700 w-24">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {correctiveActions.map((ca) => {
              const nc = nonConformities.find((n) => n.id === ca.nonConformityId);
              const overdue = ca.dueDate ? isDueDateOverdue(ca.dueDate) : false;
              const dueSoon = ca.dueDate ? isDueSoon(ca.dueDate) : false;
              const caStatus = ca.status as keyof typeof CA_STATUS_LABELS;
              const isEditing = editingCaId === ca.id;

              return (
                <React.Fragment key={ca.id}>
                  <tr
                    onClick={() => !readOnly && setEditingCaId(isEditing ? null : ca.id)}
                    className={cn(
                      "h-11 border-b border-zinc-200 transition-colors group",
                      !readOnly && "hover:bg-blue-50 cursor-pointer"
                    )}
                  >
                    {/* Espandi/Collassa + Descrizione */}
                    <td className="px-3 py-0">
                      <div className="flex items-center gap-2">
                        {!readOnly && (
                          <ChevronRight
                            className={cn(
                              "w-4 h-4 text-zinc-400 transition-transform shrink-0",
                              isEditing && "rotate-90"
                            )}
                          />
                        )}
                        <p className="text-xs text-zinc-900 truncate max-w-xs">{ca.description}</p>
                      </div>
                    </td>

                    {/* NC Collegata */}
                    <td className="px-3 py-0">
                      <p className="text-xs text-zinc-600 truncate max-w-xs">
                        {nc?.checklistItem?.question || nc?.title || "N/A"}
                      </p>
                    </td>

                    {/* Responsabile */}
                    <td className="px-3 py-0">
                      <div className="flex items-center gap-1">
                        {ca.responsiblePersonName && (
                          <>
                            <User className="w-3 h-3 text-zinc-400" />
                            <span className="text-xs text-zinc-600">{ca.responsiblePersonName}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Scadenza + Badge */}
                    <td className="px-3 py-0">
                      {ca.dueDate ? (
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs",
                            overdue && ca.status !== "completed" ? "text-red-600 font-medium" : "text-zinc-600"
                          )}>
                            {new Intl.DateTimeFormat("it-IT").format(new Date(ca.dueDate))}
                          </span>
                          {overdue && ca.status !== "completed" && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          )}
                          {dueSoon && !overdue && ca.status !== "completed" && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-700 border-0">
                              In scadenza
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>

                    {/* Stato */}
                    <td className="px-3 py-0">
                      <Badge className={cn("text-xs", CA_STATUS_COLORS[caStatus])}>
                        {CA_STATUS_LABELS[caStatus]}
                      </Badge>
                    </td>

                    {/* Azioni */}
                    <td className="px-3 py-0 text-right shrink-0">
                      <div className={cn(
                        "flex items-center justify-end gap-1 transition-opacity",
                        readOnly ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                      )}>
                        {/* Status Dropdown */}
                        <select
                          value={ca.status ?? "pending"}
                          onChange={(e) => handleStatusChange(ca.id, e.target.value)}
                          disabled={readOnly}
                          className={cn(
                            "text-xs border border-zinc-200 rounded px-1.5 py-0.5 bg-white text-zinc-700 h-6",
                            readOnly && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="pending">In attesa</option>
                          <option value="in_progress">In corso</option>
                          <option value="completed">Completata</option>
                        </select>

                        {/* Quick Close Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={readOnly}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickClose(ca.id);
                          }}
                          className="h-6 px-2 text-xs"
                          title={readOnly ? "Modalità sola lettura" : "Chiudi AC"}
                        >
                          <X className="w-3 h-3" />
                        </Button>

                        {/* Edit Button */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={readOnly}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCaId(isEditing ? null : ca.id);
                          }}
                          className="h-6 px-2 text-xs"
                          title={readOnly ? "Modalità sola lettura" : "Modifica AC"}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* EDIT FORM ROW (expanded below AC row) */}
                  {isEditing && (
                    <tr className="border-b border-zinc-100 bg-zinc-50">
                      <td colSpan={6} className="px-4 py-3">
                        <EditCaForm
                          ca={ca}
                          onSuccess={() => setEditingCaId(null)}
                          onCancel={() => setEditingCaId(null)}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// REPORT GENERATOR (utility function)
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
// REPORT MODAL (Dialog component)
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
// EDIT CA FORM (NEW COMPONENT)
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
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
      <h4 className="text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-2">
        Modifica Azione Correttiva
      </h4>

      <div className="grid grid-cols-2 gap-3">
        {/* Descrizione */}
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">
            Descrizione <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descrizione dell'azione correttiva..."
            rows={2}
            className="w-full text-xs border border-zinc-300 rounded px-2 py-1.5 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-500"
            disabled={isLoading}
          />
        </div>

        {/* Piano d'azione */}
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">
            Piano d'azione
          </label>
          <textarea
            value={actionPlan}
            onChange={(e) => setActionPlan(e.target.value)}
            placeholder="Dettagli del piano d'azione..."
            rows={2}
            className="w-full text-xs border border-zinc-300 rounded px-2 py-1.5 placeholder:text-zinc-400 focus:ring-1 focus:ring-zinc-500"
            disabled={isLoading}
          />
        </div>

        {/* Causa radice */}
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">
            Causa radice
          </label>
          <Input
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="Analisi della causa radice..."
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>

        {/* Responsabile */}
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">
            Responsabile
          </label>
          <Input
            value={responsiblePersonName}
            onChange={(e) => setResponsiblePersonName(e.target.value)}
            placeholder="Nome responsabile"
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>

        {/* Email responsabile */}
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">
            Email responsabile
          </label>
          <Input
            type="email"
            value={responsiblePersonEmail}
            onChange={(e) => setResponsiblePersonEmail(e.target.value)}
            placeholder="email@example.com"
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>

        {/* Scadenza */}
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">
            Scadenza
          </label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-xs h-8"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Bottoni */}
      <div className="flex gap-2 justify-end pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isLoading}
        >
          Annulla
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isLoading}
          className="bg-zinc-900 text-white"
        >
          {isLoading ? "Salvataggio..." : "Salva"}
        </Button>
      </div>
    </form>
  );
}

// ============================================
// MAIN TAB COMPONENT
// ============================================

export function NcAcTab({ audit, nonConformities, correctiveActions, readOnly = false }: NcAcTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"nc" | "ac">("nc");
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportOpen(true)}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Genera Report
          </Button>
        </div>

        {/* Subtab Buttons */}
        <div className="flex gap-4 mt-4 border-b border-zinc-100">
          <button
            onClick={() => setActiveSubTab("nc")}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors pb-2 border-b-2",
              activeSubTab === "nc"
                ? "text-zinc-900 border-b-zinc-900"
                : "text-zinc-500 border-b-transparent hover:text-zinc-700"
            )}
          >
            Non Conformità
          </button>
          <button
            onClick={() => setActiveSubTab("ac")}
            className={cn(
              "px-3 py-2 text-sm font-medium transition-colors pb-2 border-b-2",
              activeSubTab === "ac"
                ? "text-zinc-900 border-b-zinc-900"
                : "text-zinc-500 border-b-transparent hover:text-zinc-700"
            )}
          >
            Azioni Correttive
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeSubTab === "nc" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-8"></th>
                  <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-24">Severità</th>
                  <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-32">Stato</th>
                  <th className="px-3 py-3 text-left font-semibold text-zinc-700 flex-1">
                    Domanda Collegata
                  </th>
                  <th className="px-3 py-3 text-right font-semibold text-zinc-700 w-12">Azioni</th>
                </tr>
              </thead>
              <tbody>
                {nonConformities.map((nc) => {
                  const ncCas = correctiveActions.filter((ca) => ca.nonConformityId === nc.id);
                  return (
                    <NcRow key={nc.id} nc={nc} cas={ncCas} auditId={audit.id} readOnly={readOnly} />
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <AcTable
            correctiveActions={correctiveActions}
            nonConformities={nonConformities}
            auditId={audit.id}
            readOnly={readOnly}
          />
        )}
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
