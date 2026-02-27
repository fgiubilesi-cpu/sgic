import { z } from "zod";

// Audit outcome type
export type AuditOutcome = 'compliant' | 'non_compliant' | 'not_applicable' | 'pending';

// Human-readable labels
export const OUTCOME_LABELS: Record<AuditOutcome, string> = {
  compliant: "Compliant",
  non_compliant: "Non-Compliant",
  not_applicable: "N/A",
  pending: "Pending",
};

// Color classes for UI badges
export const OUTCOME_COLORS: Record<AuditOutcome, string> = {
  compliant: "bg-green-100 text-green-800 border-green-200",
  non_compliant: "bg-red-100 text-red-800 border-red-200",
  not_applicable: "bg-gray-100 text-gray-800 border-gray-200",
  pending: "bg-yellow-50 text-yellow-800 border-yellow-200 border-dashed",
};

// Zod schema (for Server Action validation)
export const auditOutcomeSchema = z.enum(['compliant', 'non_compliant', 'not_applicable', 'pending']);
