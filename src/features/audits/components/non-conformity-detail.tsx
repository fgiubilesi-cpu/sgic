"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, ArrowLeft, CheckCircle2, Clock3 } from "lucide-react";
import type { NonConformity } from "@/features/audits/queries/get-non-conformities";
import type { CorrectiveAction } from "@/features/audits/queries/get-corrective-actions";
import {
  NC_SEVERITY_COLORS,
  NC_SEVERITY_LABELS,
  NC_STATUS_COLORS,
  NC_STATUS_LABELS,
  type NCsSeverity,
  type NCsStatus,
} from "@/features/quality/constants";
import {
  countOpenCorrectiveActions,
  countOverdueCorrectiveActions,
  getNextCorrectiveActionDeadline,
  getNonConformityActionSummary,
} from "@/features/quality/lib/quality-process";
import {
  toCanonicalCorrectiveAction,
  toProcessCorrectiveActionShape,
} from "@/features/quality/lib/nc-ac-contract";
import { updateNonConformity } from "@/features/audits/actions/non-conformity-actions";
import { cn } from "@/lib/utils";
import { formatAuditDateLabel } from "@/features/audits/lib/audit-process-view";
import { CorrectiveActionsList } from "./corrective-actions-list";

interface NonConformityDetailProps {
  nonConformity: NonConformity;
  /** Pre-fetched server-side from audits/[id]/page.tsx — no client-side fetch needed. */
  correctiveActions: CorrectiveAction[];
  onBack: () => void;
}

export function NonConformityDetail({
  nonConformity,
  correctiveActions,
  onBack,
}: NonConformityDetailProps) {
  const router = useRouter();
  const [severity, setSeverity] = useState<NCsSeverity>(nonConformity.severity);
  const [ncStatus, setNcStatus] = useState<"open" | "pending_verification" | "closed">(
    nonConformity.status as "open" | "pending_verification" | "closed"
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const processActions = correctiveActions.map((action) =>
    toProcessCorrectiveActionShape(toCanonicalCorrectiveAction(action))
  );
  const actionSummary = getNonConformityActionSummary({
    corrective_actions: processActions,
    severity: nonConformity.severity,
  });
  const openActions = countOpenCorrectiveActions(processActions);
  const overdueActions = countOverdueCorrectiveActions(processActions);
  const nextDeadline = getNextCorrectiveActionDeadline(processActions);

  const createdDate = formatAuditDateLabel(nonConformity.createdAt, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleStatusChange = async (newStatus: NCsStatus) => {
    setNcStatus(newStatus);
    setIsUpdating(true);
    try {
      const result = await updateNonConformity({
        id: nonConformity.id,
        title: nonConformity.title,
        description: nonConformity.description || undefined,
        severity,
        status: newStatus,
      });

      if (!result.success) {
        toast.error(result.error);
        setNcStatus(nonConformity.status as NCsStatus);
      } else {
        toast.success("Status updated");
        router.refresh();
      }
    } catch {
      toast.error("Failed to update status");
      setNcStatus(nonConformity.status as NCsStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSeverityChange = async (newSeverity: NCsSeverity) => {
    setSeverity(newSeverity);
    setIsUpdating(true);
    try {
      const result = await updateNonConformity({
        id: nonConformity.id,
        title: nonConformity.title,
        description: nonConformity.description || undefined,
        severity: newSeverity,
        status: ncStatus,
      });

      if (!result.success) {
        toast.error(result.error);
        setSeverity(nonConformity.severity);
      } else {
        toast.success("Severity updated");
        router.refresh();
      }
    } catch {
      toast.error("Failed to update severity");
      setSeverity(nonConformity.severity);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {nonConformity.title}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Rilevata il {createdDate}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge className={NC_SEVERITY_COLORS[severity]}>
            {NC_SEVERITY_LABELS[severity]}
          </Badge>
          <Badge className={NC_STATUS_COLORS[ncStatus]}>
            {NC_STATUS_LABELS[ncStatus]}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-4 md:col-span-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-600" />
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  actionSummary.tone === "critical" && "text-red-700",
                  actionSummary.tone === "success" && "text-emerald-700",
                  actionSummary.tone === "warning" && "text-amber-700",
                  actionSummary.tone === "neutral" && "text-zinc-900"
                )}
              >
                {actionSummary.label}
              </p>
              {actionSummary.detail ? (
                <p className="mt-1 text-sm text-zinc-600">{actionSummary.detail}</p>
              ) : null}
              <p className="mt-3 text-xs text-zinc-500">
                La NC resta aperta finche ci sono AC attive; passa in verifica quando risultano tutte completate.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="font-semibold text-sm text-zinc-900 mb-3">
            Pressione operativa
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Aperte</span>
              <span className="font-semibold text-zinc-900">{openActions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">In ritardo</span>
              <span className={cn("font-semibold", overdueActions > 0 ? "text-red-700" : "text-zinc-900")}>
                {overdueActions}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Prossima scadenza</span>
              <span className="font-semibold text-zinc-900">
                {nextDeadline ? formatAuditDateLabel(nextDeadline) : "Non definita"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="font-semibold text-sm text-zinc-900 mb-3">Gestione NC</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">Severity</p>
              <Select
                value={severity}
                onValueChange={(value) => handleSeverityChange(value as NCsSeverity)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">Status</p>
              <Select
                value={ncStatus}
                onValueChange={(value) => handleStatusChange(value as NCsStatus)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="pending_verification">Pending Verification</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="font-semibold text-sm text-zinc-900 mb-3">Contesto</h3>
          <div className="space-y-3">
            {nonConformity.checklistItem ? (
              <div>
                <p className="text-xs font-medium text-zinc-600 mb-1">
                  Domanda audit
                </p>
                <p className="text-sm text-zinc-900 leading-relaxed">
                  {nonConformity.checklistItem.question}
                </p>
              </div>
            ) : null}

            {nonConformity.description ? (
              <div>
                <p className="text-xs font-medium text-zinc-600 mb-1">
                  Descrizione operativa
                </p>
                <p className="text-sm text-zinc-700 leading-relaxed">
                  {nonConformity.description}
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-500">
                Nessuna nota aggiuntiva: la presa in carico puo partire direttamente dalle AC.
              </div>
            )}

            {overdueActions > 0 ? (
              <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                Ci sono azioni correttive in ritardo: questa vista deve servire prima di tutto a riallineare ownership e scadenze.
              </div>
            ) : null}

            {overdueActions === 0 && openActions === 0 && correctiveActions.length > 0 ? (
              <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0" />
                Tutte le AC risultano completate: puoi usare questa schermata per la verifica finale della NC.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <CorrectiveActionsList
        nonConformityId={nonConformity.id}
        correctiveActions={correctiveActions}
        isLoading={false}
        onActionsUpdated={async () => { router.refresh(); }}
        ncTitle={nonConformity.title}
        ncDescription={nonConformity.description || ""}
        ncSeverity={nonConformity.severity}
      />
    </div>
  );
}
