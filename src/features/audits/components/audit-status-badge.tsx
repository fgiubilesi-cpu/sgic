"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { AuditStatus } from "@/features/audits/schemas/audit-schema";
import { updateAuditStatus } from "../actions";

type Props = {
  auditId: string;
  currentStatus: AuditStatus;
};

const STATUS_CONFIG: Record<AuditStatus, { label: string; color: string }> = {
  "Scheduled": { label: "Scheduled", color: "bg-slate-100 text-slate-700 border-slate-200" },
  "In Progress": { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  "Review": { label: "Review", color: "bg-amber-100 text-amber-700 border-amber-200" },
  "Closed": { label: "Closed", color: "bg-green-100 text-green-700 border-green-200" },
};

export function AuditStatusBadge({ auditId, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const activeConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG["planned"];

  const handleChange = async (newStatus: string) => {
    setLoading(true);
    const oldStatus = status;
    setStatus(newStatus);

    try {
      await updateAuditStatus(auditId, newStatus);
      toast.success(`Status updated: ${STATUS_CONFIG[newStatus]?.label ?? newStatus}`);
    } catch {
      setStatus(oldStatus);
      toast.error("Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block group">
      <div
        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-colors ${activeConfig.color}`}
      >
        <span className="relative flex h-2 w-2">
          {status === "In Progress" && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
          )}
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
        {activeConfig.label}

        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>

        {/* Invisible select overlay */}
        <select
          value={status}
          onChange={(e) => handleChange(e.target.value as AuditStatus)}
          disabled={loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Change audit status"
        >
          <option value="Scheduled">Scheduled</option>
          <option value="In Progress">In Progress</option>
          <option value="Review">Review</option>
          <option value="Closed">Closed</option>
        </select>
      </div>
    </div>
  );
}
