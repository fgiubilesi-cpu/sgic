"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AuditWithChecklists } from "@/features/audits/queries/get-audit";
import {
  completeAudit,
  getAuditSummary,
} from "@/features/audits/actions/audit-completion-actions";

interface AuditCompletionSectionProps {
  audit: AuditWithChecklists;
  nonConformitiesCount: number;
}

interface SummaryData {
  totalItems: number;
  compliant: number;
  nonCompliant: number;
  notApplicable: number;
  pending: number;
  compliancePercentage: number;
  nonConformitiesCount: number;
  openNonConformities: number;
  completedActions: number;
  pendingActions: number;
}

export function AuditCompletionSection({
  audit,
  nonConformitiesCount,
}: AuditCompletionSectionProps) {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    const loadSummary = async () => {
      const result = await getAuditSummary(audit.id);
      if (result.success) {
        setSummary(result.data);
      } else {
        toast.error(result.error);
      }
      setIsLoadingSummary(false);
    };
    loadSummary();
  }, [audit.id]);

  const handleCompleteAudit = async () => {
    if (summary && summary.openNonConformities > 0) {
      const confirmComplete = confirm(
        `This audit has ${summary.openNonConformities} open non-conformities. Are you sure you want to complete the audit?`
      );
      if (!confirmComplete) return;
    }

    setIsCompleting(true);
    try {
      const result = await completeAudit({
        auditId: audit.id,
      });

      if (result.success) {
        toast.success("Audit marked as completed");
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsCompleting(false);
    }
  };

  const isAuditComplete = audit.status === "Closed";

  if (isLoadingSummary) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="h-6 bg-zinc-200 rounded animate-pulse w-1/3"></div>
          <div className="h-4 bg-zinc-200 rounded animate-pulse w-2/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-zinc-300 bg-gradient-to-r from-blue-50 to-blue-100/50">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            {isAuditComplete ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Audit Complete
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-blue-600" />
                Audit Status & Summary
              </>
            )}
          </h2>
          <p className="text-sm text-zinc-600 mt-1">
            Current status: <span className="font-semibold capitalize">{audit.status}</span>
          </p>
        </div>

        {summary && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Compliance Rate</span>
                  <span className="text-sm font-bold">{summary.compliancePercentage}%</span>
                </div>
                <Progress
                  value={summary.compliancePercentage}
                  className="h-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="rounded bg-white p-2">
                  <p className="text-xs text-zinc-600">Compliant</p>
                  <p className="text-lg font-bold text-green-600">
                    {summary.compliant}
                  </p>
                </div>
                <div className="rounded bg-white p-2">
                  <p className="text-xs text-zinc-600">Non-Compliant</p>
                  <p className="text-lg font-bold text-red-600">
                    {summary.nonCompliant}
                  </p>
                </div>
                <div className="rounded bg-white p-2">
                  <p className="text-xs text-zinc-600">N/A</p>
                  <p className="text-lg font-bold text-gray-600">
                    {summary.notApplicable}
                  </p>
                </div>
                <div className="rounded bg-white p-2">
                  <p className="text-xs text-zinc-600">Pending</p>
                  <p className="text-lg font-bold text-yellow-600">
                    {summary.pending}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded bg-white p-3">
                <p className="text-sm font-medium text-zinc-900">
                  Non-Conformities
                </p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <p className="text-xs text-zinc-600">Total</p>
                    <p className="text-lg font-bold">
                      {summary.nonConformitiesCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600">Open</p>
                    <p className="text-lg font-bold text-orange-600">
                      {summary.openNonConformities}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded bg-white p-3">
                <p className="text-sm font-medium text-zinc-900">
                  Corrective Actions
                </p>
                <div className="flex gap-4 mt-2">
                  <div>
                    <p className="text-xs text-zinc-600">Completed</p>
                    <p className="text-lg font-bold text-green-600">
                      {summary.completedActions}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-600">Pending</p>
                    <p className="text-lg font-bold text-yellow-600">
                      {summary.pendingActions}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isAuditComplete && (
          <div className="pt-4 flex gap-2 justify-end">
            <Button
              onClick={handleCompleteAudit}
              disabled={isCompleting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? "Completing..." : "Complete Audit"}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
