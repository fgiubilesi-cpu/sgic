"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuditWithChecklists } from "@/features/audits/queries/get-audit";
import type { NonConformity } from "@/features/audits/queries/get-non-conformities";
import {
  NC_SEVERITY_LABELS,
  NC_SEVERITY_COLORS,
  NC_STATUS_LABELS,
  NC_STATUS_COLORS,
} from "@/types/database.types";
import { createNonConformity } from "@/features/audits/actions/non-conformity-actions";
import { NonConformityForm } from "./non-conformity-form";
import { NonConformityDetail } from "./non-conformity-detail";

interface NonConformitiesListProps {
  audit: AuditWithChecklists;
  nonConformities: NonConformity[];
}

export function NonConformitiesList({
  audit,
  nonConformities,
}: NonConformitiesListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedNC, setSelectedNC] = useState<NonConformity | null>(null);
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);

  const nonCompliantItems = (audit.checklists || [])
    .flatMap((c) => c.items || [])
    .filter((item) => item.outcome === "non_compliant");

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
    return (
      <NonConformityDetail
        nonConformity={selectedNC}
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
          {nonConformities.map((nc) => (
            <button
              key={nc.id}
              onClick={() => setSelectedNC(nc)}
              className="w-full text-left rounded-lg border border-zinc-200 bg-white p-4 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-zinc-900 break-words">
                    {nc.title}
                  </h3>
                  {nc.checklistItem && (
                    <p className="text-sm text-zinc-500 mt-1">
                      {nc.checklistItem.question}
                    </p>
                  )}
                  {nc.description && (
                    <p className="text-sm text-zinc-600 mt-2">{nc.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={NC_SEVERITY_COLORS[nc.severity]}>
                    {NC_SEVERITY_LABELS[nc.severity]}
                  </Badge>
                  <Badge className={NC_STATUS_COLORS[nc.status]}>
                    {NC_STATUS_LABELS[nc.status]}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
