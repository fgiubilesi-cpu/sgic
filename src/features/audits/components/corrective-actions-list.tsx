"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CorrectiveAction } from "@/features/audits/queries/get-corrective-actions";
import {
  CA_STATUS_LABELS,
  CA_STATUS_COLORS,
} from "@/features/quality/constants";
import {
  countOpenCorrectiveActions,
  countOverdueCorrectiveActions,
} from "@/features/quality/lib/quality-process";
import {
  toCanonicalCorrectiveAction,
  toProcessCorrectiveActionShape,
} from "@/features/quality/lib/nc-ac-contract";
import { cn } from "@/lib/utils";
import {
  completeCorrectiveAction,
  createCorrectiveAction,
} from "@/features/audits/actions/corrective-action-actions";
import {
  formatAuditDateLabel,
  getAuditCorrectiveActionDeadline,
  getCorrectiveActionOperationalFocus,
  isAuditCorrectiveActionOverdue,
  sortCorrectiveActionsForAudit,
} from "@/features/audits/lib/audit-process-view";
import { CorrectiveActionForm } from "./corrective-action-form";
import { CorrectiveActionDetail } from "./corrective-action-detail";

interface CorrectiveActionsListProps {
  nonConformityId: string;
  correctiveActions: CorrectiveAction[];
  isLoading: boolean;
  onActionsUpdated: () => Promise<void>;
  ncTitle?: string;
  ncDescription?: string;
  ncSeverity?: "minor" | "major" | "critical";
}

export function CorrectiveActionsList({
  nonConformityId,
  correctiveActions,
  isLoading,
  onActionsUpdated,
  ncTitle,
  ncDescription,
  ncSeverity,
}: CorrectiveActionsListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCA, setSelectedCA] = useState<CorrectiveAction | null>(null);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isCompletingId, setIsCompletingId] = useState<string | null>(null);
  const processActions = correctiveActions.map((action) =>
    toProcessCorrectiveActionShape(toCanonicalCorrectiveAction(action))
  );
  const openActions = countOpenCorrectiveActions(processActions);
  const overdueActions = countOverdueCorrectiveActions(processActions);
  const sortedCorrectiveActions = sortCorrectiveActionsForAudit(correctiveActions);

  const handleCreateCA = async (data: {
    description: string;
    rootCause: string;
    actionPlan: string;
    responsiblePersonName: string;
    responsiblePersonEmail: string;
    targetCompletionDate: string;
  }) => {
    setIsLoadingCreate(true);
    try {
      const result = await createCorrectiveAction({
        nonConformityId,
        description: data.description,
        rootCause: data.rootCause,
        actionPlan: data.actionPlan,
        responsiblePersonName: data.responsiblePersonName,
        responsiblePersonEmail: data.responsiblePersonEmail,
        targetCompletionDate: data.targetCompletionDate,
      });

      if (result.success) {
        toast.success("Corrective action created");
        setIsCreating(false);
        await onActionsUpdated();
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsLoadingCreate(false);
    }
  };

  const handleCompleteCA = async (caId: string) => {
    setIsCompletingId(caId);
    try {
      const result = await completeCorrectiveAction({ id: caId });
      if (result.success) {
        toast.success("Corrective action completed");
        await onActionsUpdated();
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsCompletingId(null);
    }
  };

  if (selectedCA) {
    return (
      <CorrectiveActionDetail
        correctiveAction={selectedCA}
        onBack={() => setSelectedCA(null)}
        onUpdated={onActionsUpdated}
        onCompleted={() => {
          handleCompleteCA(selectedCA.id);
          setSelectedCA(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            Corrective Actions
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Remediation plans for this non-conformity
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="sm">
          Add Action
        </Button>
      </div>

      {isCreating && (
        <CorrectiveActionForm
          onSubmit={handleCreateCA}
          onCancel={() => setIsCreating(false)}
          isLoading={isLoadingCreate}
          ncTitle={ncTitle}
          ncDescription={ncDescription}
          ncSeverity={ncSeverity}
        />
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : correctiveActions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-8 text-sm text-zinc-500 text-center">
          Serve almeno una azione correttiva per spostare questa NC dalla rilevazione alla presa in carico.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-zinc-100 text-zinc-700 border-zinc-200">
              {correctiveActions.length} totali
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              {openActions} aperte
            </Badge>
            {overdueActions > 0 ? (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                {overdueActions} in ritardo
              </Badge>
            ) : null}
          </div>

          {sortedCorrectiveActions.map((ca) => {
            const focus = getCorrectiveActionOperationalFocus(ca);
            const deadline = getAuditCorrectiveActionDeadline(ca);
            const overdue = isAuditCorrectiveActionOverdue(ca);

            return (
            <button
              key={ca.id}
              onClick={() => setSelectedCA(ca)}
              className={cn(
                "w-full text-left rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50",
                overdue ? "border-red-200 bg-red-50/40" : ""
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-900 break-words line-clamp-2">
                    {ca.description}
                  </h3>

                  <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <p
                      className={cn(
                        "text-xs font-medium",
                        focus.tone === "critical" && "text-red-700",
                        focus.tone === "success" && "text-emerald-700",
                        focus.tone === "warning" && "text-amber-700",
                        focus.tone === "neutral" && "text-zinc-700"
                      )}
                    >
                      {focus.label}
                    </p>
                    {focus.detail ? (
                      <p className="mt-1 text-[11px] text-zinc-500">{focus.detail}</p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-600">
                    {ca.responsiblePersonName ? (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {ca.responsiblePersonName}
                      </span>
                    ) : (
                      <span className="text-amber-700">Responsabile da assegnare</span>
                    )}

                    {deadline ? (
                      <span
                        className={cn(
                          "flex items-center gap-1",
                          overdue ? "text-red-700 font-medium" : ""
                        )}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {formatAuditDateLabel(deadline)}
                        {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
                      </span>
                    ) : (
                      <span className="text-amber-700">Scadenza da definire</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={CA_STATUS_COLORS[ca.status]}>
                    {CA_STATUS_LABELS[ca.status]}
                  </Badge>
                  {ca.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCompleteCA(ca.id);
                      }}
                      disabled={isCompletingId === ca.id}
                    >
                      {isCompletingId === ca.id ? "..." : "Complete"}
                    </Button>
                  )}
                </div>
              </div>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
