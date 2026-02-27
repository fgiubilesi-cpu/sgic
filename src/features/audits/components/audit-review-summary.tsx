"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { EvidenceGallery } from "./evidence-gallery";
import type { EvidenceItem } from "@/features/audits/queries/get-audit-evidence";
import type { AuditTrailEntry } from "@/features/audits/queries/get-audit-trail";
import type { AuditWithChecklists } from "@/features/audits/queries/get-audit";
import { closeAudit } from "@/features/audits/actions/audit-completion-actions";
import { cn } from "@/lib/utils";

type AuditReviewSummaryProps = {
  audit: AuditWithChecklists;
  evidence: EvidenceItem[];
  auditTrail: AuditTrailEntry[];
  nonConformitiesCount: number;
  openNonConformitiesCount: number;
  compliancePercentage: number;
};

export function AuditReviewSummary({
  audit,
  evidence,
  auditTrail,
  nonConformitiesCount,
  openNonConformitiesCount,
  compliancePercentage,
}: AuditReviewSummaryProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [expandedTrail, setExpandedTrail] = useState(false);
  const isClosed = audit.status === "Closed";
  const canClose = audit.status === "Review" && !isClosed;

  const handleCloseAudit = async () => {
    if (!canClose) return;

    const confirmed = window.confirm(
      "Are you sure you want to close this audit? This action cannot be undone without auditor approval."
    );

    if (!confirmed) return;

    setIsClosing(true);
    try {
      const result = await closeAudit({ auditId: audit.id });

      if ("success" in result && result.success) {
        toast.success("Audit closed successfully");
        window.location.reload(); // Reload to reflect status change
      } else if ("error" in result) {
        toast.error(result.error || "Failed to close audit");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      toast.error("Failed to close audit: " + message);
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div
        className={cn(
          "rounded-lg border-2 p-4",
          isClosed
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50"
        )}
      >
        <div className="flex items-center gap-3">
          {isClosed ? (
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          ) : (
            <Clock className="w-6 h-6 text-amber-600" />
          )}
          <div className="flex-1">
            <h3 className={cn(
              "font-semibold",
              isClosed ? "text-green-900" : "text-amber-900"
            )}>
              {isClosed ? "Audit Closed" : "Audit Under Review"}
            </h3>
            <p className={cn(
              "text-sm",
              isClosed ? "text-green-700" : "text-amber-700"
            )}>
              {isClosed
                ? "This audit has been finalized and closed."
                : "This audit is ready for final review before closure."}
            </p>
          </div>
        </div>
      </div>

      {/* Final Verdict Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 mb-4">
          Final Verdict
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Compliance Score */}
          <div className="rounded-lg border border-zinc-200 p-4">
            <div className="text-sm font-medium text-zinc-600 mb-2">
              Compliance Score
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-900">
                {compliancePercentage}%
              </span>
            </div>
            <div className="w-full bg-zinc-200 rounded-full h-2 mt-3">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  compliancePercentage >= 80
                    ? "bg-green-500"
                    : compliancePercentage >= 60
                      ? "bg-amber-500"
                      : "bg-red-500"
                )}
                style={{ width: `${compliancePercentage}%` }}
              />
            </div>
          </div>

          {/* Non-Conformities */}
          <div className="rounded-lg border border-zinc-200 p-4">
            <div className="text-sm font-medium text-zinc-600 mb-2">
              Non-Conformities
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-zinc-900">
                {nonConformitiesCount}
              </span>
              <span className="text-sm text-zinc-600">
                ({openNonConformitiesCount} open)
              </span>
            </div>
            {openNonConformitiesCount > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-red-600">
                <AlertCircle className="w-4 h-4" />
                Requires corrective actions
              </div>
            )}
          </div>

          {/* Status */}
          <div className="rounded-lg border border-zinc-200 p-4">
            <div className="text-sm font-medium text-zinc-600 mb-2">
              Audit Status
            </div>
            <div className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
              isClosed
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-700"
            )}>
              {isClosed ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              {audit.status}
            </div>
          </div>
        </div>

        {/* Summary Text */}
        <div className="rounded-lg bg-zinc-50 p-4">
          <p className="text-sm text-zinc-700 leading-relaxed">
            {compliancePercentage >= 80
              ? "✅ High compliance achieved. "
              : compliancePercentage >= 60
                ? "⚠️ Moderate compliance with some areas needing attention. "
                : "❌ Low compliance requiring significant improvements. "}
            {nonConformitiesCount > 0
              ? `${nonConformitiesCount} non-conformit${nonConformitiesCount === 1 ? "y" : "ies"} identified. `
              : "No non-conformities identified. "}
            {openNonConformitiesCount > 0
              ? `${openNonConformitiesCount} corrective action${openNonConformitiesCount === 1 ? "" : "s"} pending resolution.`
              : "All corrective actions have been addressed."}
          </p>
        </div>
      </div>

      {/* Evidence Gallery */}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 mb-4">
          Evidence Documentation
        </h2>
        <EvidenceGallery evidence={evidence} auditTitle={audit.title || "Audit"} />
      </div>

      {/* Audit Trail History */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <button
          onClick={() => setExpandedTrail(!expandedTrail)}
          className="flex w-full items-center justify-between mb-4 hover:opacity-75 transition-opacity"
        >
          <h2 className="text-lg font-semibold tracking-tight text-zinc-900">
            Status Change History
          </h2>
          {expandedTrail ? (
            <ChevronUp className="w-5 h-5 text-zinc-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-600" />
          )}
        </button>

        {expandedTrail && (
          <div className="space-y-3">
            {auditTrail.length === 0 ? (
              <p className="text-sm text-zinc-500 italic">No status changes recorded yet.</p>
            ) : (
              auditTrail.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex gap-4 pb-3 border-b border-zinc-100 last:border-b-0"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-zinc-400 flex-shrink-0" />
                    {index < auditTrail.length - 1 && (
                      <div className="w-0.5 h-8 bg-zinc-200" />
                    )}
                  </div>

                  {/* Entry content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-medium text-zinc-900">
                        {entry.oldStatus} → {entry.newStatus}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-600 space-y-1">
                      <p>
                        Changed by:{" "}
                        <span className="font-medium">
                          {entry.changedByEmail || entry.changedBy}
                        </span>
                      </p>
                      <p>
                        {new Date(entry.changedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Close Audit Button */}
      {canClose && (
        <div className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                Ready to Close?
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                Once closed, this audit record becomes permanent. Ensure all reviews are complete
                before closing.
              </p>
              <Button
                onClick={handleCloseAudit}
                disabled={isClosing}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {isClosing ? "Closing..." : "Close Audit"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isClosed && (
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-900">
                Audit Closed
              </h3>
              <p className="text-sm text-green-700">
                This audit has been finalized. No further changes can be made without
                reopening the audit.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
