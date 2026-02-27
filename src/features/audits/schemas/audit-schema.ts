import { z } from "zod";

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
});

export type CreateAuditSchema = z.infer<typeof createAuditSchema>;
