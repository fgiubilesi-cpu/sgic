import { z } from "zod";

export const auditOutcomeValues = ["compliant", "non_compliant", "not_applicable", "pending"] as const;
export const auditOutcomeSchema = z.enum(auditOutcomeValues);
export type AuditOutcome = z.infer<typeof auditOutcomeSchema>;

export const OUTCOME_COLORS: Record<AuditOutcome, string> = {
  compliant: "bg-green-100 border-green-300",
  non_compliant: "bg-red-100 border-red-300",
  not_applicable: "bg-gray-100 border-gray-300",
  pending: "bg-yellow-100 border-yellow-300",
};

export const auditStatusValues = ["Scheduled", "In Progress", "Review", "Closed"] as const;

export type AuditStatus = (typeof auditStatusValues)[number];

export const createAuditSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(200, "Title is too long."),
  scheduled_date: z.coerce.date(),
  status: z.enum(auditStatusValues).default("Scheduled"),
  client_id: z.string().uuid("Client is required."),
  location_id: z.string().uuid("Location is required."),
});

export type CreateAuditSchema = z.infer<typeof createAuditSchema>;
