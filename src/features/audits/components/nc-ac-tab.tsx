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
  ncId: string;
  auditId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddCaForm({ ncId, auditId, onSuccess, onCancel }: AddCaFormProps) {
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("La descrizione è obbligatoria.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createCorrectiveAction({
        nonConformityId: ncId,
        description: description.trim(),
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
      <h4 className="text-xs font-semibold text-zinc-700 uppercase tracking-wide">
        Nuova azione correttiva
      </h4>
      <div>
        <label className="text-xs font-medium text-zinc-600 mb-1 block">
          Descrizione <span className="text-red-500">*</span>
        </label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descrivere l'azione correttiva da intraprendere..."
          className="text-sm h-8"
          disabled={isLoading}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-zinc-600 mb-1 block">
            Assegnata a
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

function NcRow({ nc, cas, auditId }: NcRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAddCa, setShowAddCa] = useState(false);

  const severity = nc.severity as keyof typeof NC_SEVERITY_LABELS;
  const status = nc.status as keyof typeof NC_STATUS_LABELS;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
      {/* NC header row */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
      >
        <span className="mt-0.5 text-zinc-400 shrink-0">
          {expanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="font-medium text-sm text-zinc-900 break-words">{nc.title}</span>
          </div>
          {nc.checklistItem && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              Item: {nc.checklistItem.question}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn("text-xs", NC_SEVERITY_COLORS[severity])}>
            {NC_SEVERITY_LABELS[severity]}
          </Badge>
          <Badge className={cn("text-xs", NC_STATUS_COLORS[status])}>
            {NC_STATUS_LABELS[status]}
          </Badge>
          <span className="text-xs text-zinc-400">{cas.length} AC</span>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 py-3 space-y-3">
          {nc.description && (
            <p className="text-sm text-zinc-600">{nc.description}</p>
          )}

          {/* Corrective Actions list */}
          {cas.length === 0 ? (
            <p className="text-xs text-zinc-400 italic">Nessuna azione correttiva registrata.</p>
          ) : (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-600 uppercase tracking-wide">
                Azioni correttive
              </h4>
              {cas.map((ca) => {
                const overdue = ca.targetCompletionDate
                  ? isDueDateOverdue(ca.targetCompletionDate)
                  : false;
                const caStatus = ca.status as keyof typeof CA_STATUS_LABELS;
                return (
                  <div
                    key={ca.id}
                    className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 flex items-start justify-between gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-800 break-words">{ca.description}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {ca.responsiblePersonName && (
                          <span className="flex items-center gap-1 text-xs text-zinc-500">
                            <User className="w-3 h-3" />
                            {ca.responsiblePersonName}
                          </span>
                        )}
                        {ca.targetCompletionDate && (
                          <span
                            className={cn(
                              "flex items-center gap-1 text-xs",
                              overdue ? "text-red-600 font-semibold" : "text-zinc-500"
                            )}
                          >
                            <Calendar className="w-3 h-3" />
                            {new Intl.DateTimeFormat("it-IT").format(
                              new Date(ca.targetCompletionDate)
                            )}
                            {overdue && (
                              <AlertTriangle className="w-3 h-3 text-red-500 ml-0.5" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={cn("text-xs shrink-0", CA_STATUS_COLORS[caStatus])}>
                      {CA_STATUS_LABELS[caStatus]}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add CA form */}
          {showAddCa ? (
            <AddCaForm
              ncId={nc.id}
              auditId={auditId}
              onSuccess={() => setShowAddCa(false)}
              onCancel={() => setShowAddCa(false)}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddCa(true)}
              className="gap-1.5 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Aggiungi AC
            </Button>
          )}
        </div>
      )}
    </div>
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
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">
            Non Conformità e Azioni Correttive
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {nonConformities.length} NC trovate · {correctiveActions.length} AC registrate
          </p>
        </div>
      </div>

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
    </div>
  );
}
