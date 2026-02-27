"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import type { NonConformity } from "@/features/audits/queries/get-non-conformities";
import type { CorrectiveAction } from "@/features/audits/queries/get-corrective-actions";
import {
  NC_SEVERITY_LABELS,
  NC_SEVERITY_COLORS,
  NC_STATUS_LABELS,
  NC_STATUS_COLORS,
} from "@/types/database.types";
import { getCorrectiveActionsByNonConformity } from "@/features/audits/queries/get-corrective-actions";
import { CorrectiveActionsList } from "./corrective-actions-list";

interface NonConformityDetailProps {
  nonConformity: NonConformity;
  onBack: () => void;
}

export function NonConformityDetail({
  nonConformity,
  onBack,
}: NonConformityDetailProps) {
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCAs = async () => {
      const cas = await getCorrectiveActionsByNonConformity(nonConformity.id);
      setCorrectiveActions(cas);
      setIsLoading(false);
    };
    loadCAs();
  }, [nonConformity.id]);

  const createdDate = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(nonConformity.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {nonConformity.title}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Created {createdDate}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="font-semibold text-sm text-zinc-900 mb-3">Details</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">Severity</p>
              <Badge className={NC_SEVERITY_COLORS[nonConformity.severity]}>
                {NC_SEVERITY_LABELS[nonConformity.severity]}
              </Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">Status</p>
              <Badge className={NC_STATUS_COLORS[nonConformity.status]}>
                {NC_STATUS_LABELS[nonConformity.status]}
              </Badge>
            </div>
            {nonConformity.checklistItem && (
              <div>
                <p className="text-xs font-medium text-zinc-600 mb-1">
                  Related Question
                </p>
                <p className="text-sm text-zinc-900">
                  {nonConformity.checklistItem.question}
                </p>
              </div>
            )}
          </div>
        </div>

        {nonConformity.description && (
          <div className="rounded-lg border border-zinc-200 bg-white p-4">
            <h3 className="font-semibold text-sm text-zinc-900 mb-3">
              Description
            </h3>
            <p className="text-sm text-zinc-700 leading-relaxed">
              {nonConformity.description}
            </p>
          </div>
        )}
      </div>

      <CorrectiveActionsList
        nonConformityId={nonConformity.id}
        correctiveActions={correctiveActions}
        isLoading={isLoading}
        onActionsUpdated={async () => {
          const cas = await getCorrectiveActionsByNonConformity(
            nonConformity.id
          );
          setCorrectiveActions(cas);
        }}
        ncTitle={nonConformity.title}
        ncDescription={nonConformity.description || ""}
        ncSeverity={nonConformity.severity}
      />
    </div>
  );
}
