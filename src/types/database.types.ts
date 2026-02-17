import { z } from "zod";

// 1. Definizione TypeScript Pura
export type AuditOutcome = 'compliant' | 'non_compliant' | 'not_applicable' | 'pending';

// 2. Mapping per la UI (Human Readable)
export const OUTCOME_LABELS: Record<AuditOutcome, string> = {
  compliant: "Conforme",
  non_compliant: "Non Conforme",
  not_applicable: "N/A",
  pending: "Da Compilare"
};

// 3. Mapping Colori per Badge
export const OUTCOME_COLORS: Record<AuditOutcome, string> = {
    compliant: "bg-green-100 text-green-800 border-green-200",
    non_compliant: "bg-red-100 text-red-800 border-red-200",
    not_applicable: "bg-gray-100 text-gray-800 border-gray-200",
    pending: "bg-yellow-50 text-yellow-800 border-yellow-200 dashed border"
};

// 4. Zod Schema (per validazione Server Action)
export const auditOutcomeSchema = z.enum(['compliant', 'non_compliant', 'not_applicable', 'pending']);