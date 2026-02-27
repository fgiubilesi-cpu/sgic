"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CorrectiveAction } from "@/features/audits/queries/get-corrective-actions";
import {
  CA_STATUS_LABELS,
  CA_STATUS_COLORS,
} from "@/types/database.types";
import {
  completeCorrectiveAction,
  createCorrectiveAction,
} from "@/features/audits/actions/corrective-action-actions";
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
          No corrective actions defined yet
        </div>
      ) : (
        <div className="space-y-2">
          {correctiveActions.map((ca) => (
            <button
              key={ca.id}
              onClick={() => setSelectedCA(ca)}
              className="w-full text-left rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-900 break-words">
                    {ca.description}
                  </h3>
                  {ca.responsiblePersonName && (
                    <p className="text-sm text-zinc-500 mt-1">
                      Assigned to: {ca.responsiblePersonName}
                    </p>
                  )}
                  {ca.targetCompletionDate && (
                    <div className="flex items-center gap-1 text-sm text-zinc-500 mt-2">
                      <Clock className="w-4 h-4" />
                      Due: {new Date(ca.targetCompletionDate).toLocaleDateString("en-GB")}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={CA_STATUS_COLORS[ca.status]}>
                    {CA_STATUS_LABELS[ca.status]}
                  </Badge>
                  {ca.status !== "completed" && ca.status !== "cancelled" && (
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
          ))}
        </div>
      )}
    </div>
  );
}
