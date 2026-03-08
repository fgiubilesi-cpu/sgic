/**
 * Color and label constants for audit outcomes
 */

export type OutcomeType = "compliant" | "non_compliant" | "not_applicable" | "pending";

export const OUTCOME_LABELS: Record<OutcomeType, string> = {
  compliant: "Compliant",
  non_compliant: "Non-Compliant",
  not_applicable: "Not Applicable",
  pending: "Pending",
};

export const OUTCOME_COLORS: Record<OutcomeType, string> = {
  compliant: "bg-green-100 text-green-800 border-green-200",
  non_compliant: "bg-red-100 text-red-800 border-red-200",
  not_applicable: "bg-gray-100 text-gray-800 border-gray-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
};
