"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuditWithChecklists } from "@/features/audits/queries/get-audit";
import type { NonConformity } from "@/features/audits/queries/get-non-conformities";
import type { CorrectiveAction } from "@/features/audits/queries/get-corrective-actions";
import {
  NC_SEVERITY_LABELS,
  NC_SEVERITY_COLORS,
  NC_STATUS_LABELS,
  NC_STATUS_COLORS,
} from "@/features/quality/constants";
import {
  countOpenCorrectiveActions,
  countOverdueCorrectiveActions,
  getNonConformityActionSummary,
  getNonConformityProcessPressure,
} from "@/features/quality/lib/quality-process";
import {
  toCanonicalCorrectiveAction,
  toProcessCorrectiveActionShape,
} from "@/features/quality/lib/nc-ac-contract";
import { createNonConformity } from "@/features/audits/actions/non-conformity-actions";
import { cn } from "@/lib/utils";
import { NonConformityForm } from "./non-conformity-form";
import { NonConformityDetail } from "./non-conformity-detail";

interface NonConformitiesListProps {
  audit: AuditWithChecklists;
  nonConformities: NonConformity[];
  /** Pre-fetched server-side (bulk, no N+1) — filtered per NC inside this component. */
  correctiveActions: CorrectiveAction[];
}

export function NonConformitiesList({
  audit,
  nonConformities,
  correctiveActions,
}: NonConformitiesListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedNC, setSelectedNC] = useState<NonConformity | null>(null);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);

  const nonCompliantItems = (audit.checklists || [])
    .flatMap((c) => c.items || [])
    .filter((item) => item.outcome === "non_compliant");
  const sortedNonConformities = [...nonConformities].sort((left, right) => {
    const leftActions = correctiveActions
      .filter((action) => action.nonConformityId === left.id)
      .map((action) => toProcessCorrectiveActionShape(toCanonicalCorrectiveAction(action)));
    const rightActions = correctiveActions
      .filter((action) => action.nonConformityId === right.id)
      .map((action) => toProcessCorrectiveActionShape(toCanonicalCorrectiveAction(action)));

    const pressureWeight = {
      overdue: 400,
      unplanned: 300,
      in_execution: 200,
      ready_for_verification: 100,
    } as const;
    const severityWeight = {
      critical: 30,
      major: 20,
      minor: 10,
    } as const;

    const leftPressure = getNonConformityProcessPressure({
      corrective_actions: leftActions,
      severity: left.severity,
    });
    const rightPressure = getNonConformityProcessPressure({
      corrective_actions: rightActions,
      severity: right.severity,
    });

    const leftScore =
      pressureWeight[leftPressure] +
      severityWeight[left.severity] +
      (left.status === "closed" ? -200 : 0);
    const rightScore =
      pressureWeight[rightPressure] +
      severityWeight[right.severity] +
      (right.status === "closed" ? -200 : 0);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });

  const handleCreateNC = async (data: {
    checklistItemId: string;
    title: string;
    description: string;
    severity: "minor" | "major" | "critical";
  }) => {
    setIsLoadingCreate(true);
    try {
      const result = await createNonConformity({
        auditId: audit.id,
        checklistItemId: data.checklistItemId,
        title: data.title,
        description: data.description,
        severity: data.severity,
      });

      if (result.success) {
        toast.success("Non-conformity created");
        setIsCreating(false);
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsLoadingCreate(false);
    }
  };

  if (selectedNC) {
    const ncCorrectiveActions = correctiveActions.filter(
      (ca) => ca.nonConformityId === selectedNC.id
    );
    return (
      <NonConformityDetail
        nonConformity={selectedNC}
        correctiveActions={ncCorrectiveActions}
        onBack={() => setSelectedNC(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Non-Conformities
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Issues identified during the audit
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          disabled={nonCompliantItems.length === 0}
          size="sm"
        >
          Add Non-Conformity
        </Button>
      </div>

      {isCreating && nonCompliantItems.length > 0 && (
        <NonConformityForm
          auditId={audit.id}
          nonCompliantItems={nonCompliantItems}
          onSubmit={handleCreateNC}
          onCancel={() => setIsCreating(false)}
          isLoading={isLoadingCreate}
        />
      )}

      {nonConformities.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-8 text-sm text-zinc-500 text-center">
          {nonCompliantItems.length === 0
            ? "No non-compliant items in this audit"
            : "No non-conformities recorded yet"}
        </div>
      ) : (
        <div className="space-y-2">
          {sortedNonConformities.map((nc) => {
            const processActions = correctiveActions
              .filter((action) => action.nonConformityId === nc.id)
              .map((action) => toProcessCorrectiveActionShape(toCanonicalCorrectiveAction(action)));
            const actionSummary = getNonConformityActionSummary({
              corrective_actions: processActions,
              severity: nc.severity,
            });
            const openActions = countOpenCorrectiveActions(processActions);
            const overdueActions = countOverdueCorrectiveActions(processActions);
            const processPressure = getNonConformityProcessPressure({
              corrective_actions: processActions,
              severity: nc.severity,
            });

            return (
              <button
                key={nc.id}
                onClick={() => setSelectedNC(nc)}
                className={cn(
                  "w-full text-left rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50",
                  processPressure === "overdue" ? "border-red-200 bg-red-50/40" : "",
                  processPressure === "unplanned" ? "border-amber-200 bg-amber-50/40" : ""
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      {processPressure === "overdue" ? (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                      ) : null}
                      <div className="min-w-0">
                        <h3 className="font-medium text-zinc-900 break-words">
                          {nc.title}
                        </h3>
                        {nc.checklistItem ? (
                          <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                            {nc.checklistItem.question}
                          </p>
                        ) : nc.description ? (
                          <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                            {nc.description}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
                      <p
                        className={cn(
                          "text-xs font-medium",
                          actionSummary.tone === "critical" && "text-red-700",
                          actionSummary.tone === "success" && "text-emerald-700",
                          actionSummary.tone === "warning" && "text-amber-700",
                          actionSummary.tone === "neutral" && "text-zinc-700"
                        )}
                      >
                        {actionSummary.label}
                      </p>
                      {actionSummary.detail ? (
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {actionSummary.detail}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge className={NC_SEVERITY_COLORS[nc.severity]}>
                      {NC_SEVERITY_LABELS[nc.severity]}
                    </Badge>
                    <Badge className={NC_STATUS_COLORS[nc.status]}>
                      {NC_STATUS_LABELS[nc.status]}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {openActions} AC aperte
                    </Badge>
                    {overdueActions > 0 ? (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        {overdueActions} in ritardo
                      </Badge>
                    ) : null}
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
