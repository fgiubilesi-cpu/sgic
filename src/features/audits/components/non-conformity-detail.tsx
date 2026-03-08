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
import { ArrowLeft } from "lucide-react";
import type { NonConformity } from "@/features/audits/queries/get-non-conformities";
import type { CorrectiveAction } from "@/features/audits/queries/get-corrective-actions";
import {
  NC_SEVERITY_LABELS,
  NC_SEVERITY_COLORS,
  NC_STATUS_LABELS,
  NC_STATUS_COLORS,
  type NCsSeverity,
  type NCsStatus,
} from "@/features/quality/constants";
import { updateNonConformity } from "@/features/audits/actions/non-conformity-actions";
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
  const [ncStatus, setNcStatus] = useState<"open" | "pending_verification" | "closed">(nonConformity.status as "open" | "pending_verification" | "closed");
  const [isUpdating, setIsUpdating] = useState(false);

  const createdDate = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(nonConformity.createdAt));

  const handleStatusChange = async (newStatus: NCsStatus) => {
    setNcStatus(newStatus);
    setIsUpdating(true);
    try {
      const result = await updateNonConformity({
        id: nonConformity.id,
        title: nonConformity.title,
        description: nonConformity.description || undefined,
        severity: nonConformity.severity,
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
        status: nonConformity.status,
      });

      if (!result.success) {
        toast.error(result.error);
        setSeverity(nonConformity.severity);
      } else {
        toast.success("Severity updated");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to update severity");
      setSeverity(nonConformity.severity);
    } finally {
      setIsUpdating(false);
    }
  };

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
              <Select value={severity} onValueChange={(v) => handleSeverityChange(v as NCsSeverity)} disabled={isUpdating}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="minor">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-yellow-500" />
                      Minor
                    </span>
                  </SelectItem>
                  <SelectItem value="major">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500" />
                      Major
                    </span>
                  </SelectItem>
                  <SelectItem value="critical">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      Critical
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1">Status</p>
              <Select value={ncStatus} onValueChange={(v) => handleStatusChange(v as NCsStatus)} disabled={isUpdating}>
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
        isLoading={false}
        onActionsUpdated={async () => { router.refresh(); }}
        ncTitle={nonConformity.title}
        ncDescription={nonConformity.description || ""}
        ncSeverity={nonConformity.severity}
      />
    </div>
  );
}
