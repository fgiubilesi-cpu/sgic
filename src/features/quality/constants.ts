/**
 * Color and label constants for Non-Conformities and Corrective Actions
 */

import type { NCsSeverity, NCStatus as NCsStatus, ACStatus as CAStatus } from "@/features/quality/schemas/nc-ac.schema";

// Re-export types for backward compatibility
export type { NCsSeverity, NCsStatus, CAStatus };

// Non-Conformity Severity
export const NC_SEVERITY_LABELS: Record<NCsSeverity, string> = {
  minor: "Minor",
  major: "Major",
  critical: "Critical",
};

export const NC_SEVERITY_COLORS: Record<NCsSeverity, string> = {
  minor: "bg-yellow-100 text-yellow-800 border-yellow-200",
  major: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

// Non-Conformity Status
export const NC_STATUS_LABELS: Record<NCsStatus, string> = {
  open: "Open",
  pending_verification: "Pending Verification",
  closed: "Closed",
};

export const NC_STATUS_COLORS: Record<NCsStatus, string> = {
  open: "bg-blue-100 text-blue-800 border-blue-200",
  pending_verification: "bg-amber-100 text-amber-800 border-amber-200",
  closed: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

// Corrective Action Status
export const CA_STATUS_LABELS: Record<CAStatus, string> = {
  pending: "In attesa",
  in_progress: "In corso",
  completed: "Completata",
};

export const CA_STATUS_COLORS: Record<CAStatus, string> = {
  pending: "bg-zinc-100 text-zinc-700 border-zinc-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
};
