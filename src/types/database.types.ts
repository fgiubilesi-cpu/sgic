import { z } from "zod";

// ===== AUDIT OUTCOME =====
export type AuditOutcome = 'compliant' | 'non_compliant' | 'not_applicable' | 'pending';

export const OUTCOME_LABELS: Record<AuditOutcome, string> = {
  compliant: "Compliant",
  non_compliant: "Non-Compliant",
  not_applicable: "N/A",
  pending: "Pending",
};

export const OUTCOME_COLORS: Record<AuditOutcome, string> = {
  compliant: "bg-green-100 text-green-800 border-green-200",
  non_compliant: "bg-red-100 text-red-800 border-red-200",
  not_applicable: "bg-gray-100 text-gray-800 border-gray-200",
  pending: "bg-yellow-50 text-yellow-800 border-yellow-200 border-dashed",
};

export const auditOutcomeSchema = z.enum(['compliant', 'non_compliant', 'not_applicable', 'pending']);

// ===== NON-CONFORMITY SEVERITY =====
export type NCsSeverity = 'minor' | 'major' | 'critical';

export const NC_SEVERITY_LABELS: Record<NCsSeverity, string> = {
  minor: "Minor (Observation)",
  major: "Major (Must Fix)",
  critical: "Critical (Blocks Audit)",
};

export const NC_SEVERITY_COLORS: Record<NCsSeverity, string> = {
  minor: "bg-blue-100 text-blue-800 border-blue-200",
  major: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
};

export const ncSeveritySchema = z.enum(['minor', 'major', 'critical']);

// ===== NON-CONFORMITY STATUS =====
export type NCStatus = 'open' | 'in_progress' | 'closed' | 'on_hold';

export const NC_STATUS_LABELS: Record<NCStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  closed: "Closed",
  on_hold: "On Hold",
};

export const NC_STATUS_COLORS: Record<NCStatus, string> = {
  open: "bg-red-100 text-red-800 border-red-200",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-200",
  closed: "bg-green-100 text-green-800 border-green-200",
  on_hold: "bg-gray-100 text-gray-800 border-gray-200",
};

export const ncStatusSchema = z.enum(['open', 'in_progress', 'closed', 'on_hold']);

// ===== CORRECTIVE ACTION STATUS =====
export type CorrectiveActionStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export const CA_STATUS_LABELS: Record<CorrectiveActionStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export const CA_STATUS_COLORS: Record<CorrectiveActionStatus, string> = {
  pending: "bg-gray-100 text-gray-800 border-gray-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  cancelled: "bg-zinc-100 text-zinc-800 border-zinc-200",
};

export const correctiveActionStatusSchema = z.enum(['pending', 'in_progress', 'completed', 'overdue', 'cancelled']);
