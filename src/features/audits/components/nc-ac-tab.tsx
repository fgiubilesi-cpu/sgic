"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, Plus, AlertTriangle, Calendar, User } from "lucide-react";
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
import { createCorrectiveAction } from "@/features/audits/actions/corrective-action-actions";

interface NcAcTabProps {
  audit: AuditWithChecklists;
  nonConformities: NonConformity[];
  correctiveActions: CorrectiveAction[];
}

interface AddCaFormProps {
  nc: NonConformity;
  ncId: string;
  auditId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// N3: Form creazione AC da NC with full fields
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
      {/* NC Context */}
      <div>
        <h4 className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
          Nuova azione correttiva per
        </h4>
        <p className="text-xs text-zinc-600 mt-1">
          <span className="font-medium">NC:</span> {nc.title}
        </p>
      </div>

      {/* Description — required */}
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

      {/* Root Cause — optional */}
      <div>
        <label className="text-xs font-medium text-zinc-600 mb-1 block">
          Causa radice
        </label>
        <Input
          value={rootCause}
          onChange={(e) => setRootCause(e.target.value)}
          placeholder="Analisi della causa radice del problema..."
          className="text-sm h-8"
          disabled={isLoading}
        />
      </div>

      {/* Action Plan — optional */}
      <div>
        <label className="text-xs font-medium text-zinc-600 mb-1 block">
          Piano d'azione
        </label>
        <Input
          value={actionPlan}
          onChange={(e) => setActionPlan(e.target.value)}
          placeholder="Dettagli del piano d'azione da intraprendere..."
          className="text-sm h-8"
          disabled={isLoading}
        />
      </div>

      {/* Responsible + Due Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">
            Responsabile
          </label>
          <Input
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            placeholder="Nome responsabile"
            className="text-sm h-8"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">
            Scadenza
          </label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-sm h-8"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Actions */}
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

function isDueDateOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr);
  return due < today;
}

interface NcRowProps {
  nc: NonConformity;
  cas: CorrectiveAction[];
  auditId: string;
}

// N2: Compact table layout for NC
function NcRow({ nc, cas, auditId }: NcRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAddCa, setShowAddCa] = useState(false);

  const severity = nc.severity as keyof typeof NC_SEVERITY_LABELS;
  const status = nc.status as keyof typeof NC_STATUS_LABELS;

  return (
    <>
      {/* NC table row: ~44px height */}
      <tr
        onClick={() => setExpanded((prev) => !prev)}
        className="h-11 border-b border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer group"
      >
        {/* Expand icon */}
        <td className="px-3 py-0 text-zinc-400 shrink-0 w-8 text-center">
          {expanded ? (
            <ChevronDown className="w-4 h-4 inline" />
          ) : (
            <ChevronRight className="w-4 h-4 inline" />
          )}
        </td>

        {/* Severity badge */}
        <td className="px-3 py-0 w-24">
          <Badge className={cn("text-xs", NC_SEVERITY_COLORS[severity])}>
            {NC_SEVERITY_LABELS[severity]}
          </Badge>
        </td>

        {/* Status badge */}
        <td className="px-3 py-0 w-32">
          <Badge className={cn("text-xs", NC_STATUS_COLORS[status])}>
            {NC_STATUS_LABELS[status]}
          </Badge>
        </td>

        {/* Linked question / NC title */}
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

        {/* Actions */}
        <td className="px-3 py-0 text-right shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowAddCa(!showAddCa);
            }}
            className="gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            AC
          </Button>
        </td>
      </tr>

      {/* Expanded details row */}
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

              {/* Corrective Actions list */}
              {cas.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide mb-1.5">
                    Azioni Correttive
                  </h4>
                  <div className="space-y-1.5">
                    {cas.map((ca) => {
                      const overdue = ca.targetCompletionDate
                        ? isDueDateOverdue(ca.targetCompletionDate)
                        : false;
                      const caStatus = ca.status as keyof typeof CA_STATUS_LABELS;
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
                                {ca.targetCompletionDate && (
                                  <span
                                    className={cn(
                                      "flex items-center gap-0.5 text-xs",
                                      overdue ? "text-red-600 font-semibold" : "text-zinc-500"
                                    )}
                                  >
                                    <Calendar className="w-2.5 h-2.5" />
                                    {new Intl.DateTimeFormat("it-IT").format(
                                      new Date(ca.targetCompletionDate)
                                    )}
                                    {overdue && (
                                      <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge className={cn("text-xs shrink-0", CA_STATUS_COLORS[caStatus])}>
                              {CA_STATUS_LABELS[caStatus]}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add CA form */}
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

export function NcAcTab({ audit, nonConformities, correctiveActions }: NcAcTabProps) {
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
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Non Conformità e Azioni Correttive
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {nonConformities.length} NC trovate · {correctiveActions.length} AC registrate
          </p>
        </div>
      </div>

      {/* Compact table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-8"></th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-24">Severità</th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 w-32">Stato</th>
              <th className="px-3 py-3 text-left font-semibold text-zinc-700 flex-1">Domanda Collegata</th>
              <th className="px-3 py-3 text-right font-semibold text-zinc-700 w-12">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {nonConformities.map((nc) => {
              const ncCas = correctiveActions.filter(
                (ca) => ca.nonConformityId === nc.id
              );
              return (
                <NcRow
                  key={nc.id}
                  nc={nc}
                  cas={ncCas}
                  auditId={audit.id}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
