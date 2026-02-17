import { z } from "zod";

export const auditStatusValues = ["planned", "in_progress", "completed"] as const;

export type AuditStatus = (typeof auditStatusValues)[number];

export const createAuditSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Il titolo deve avere almeno 3 caratteri.")
    .max(200, "Il titolo è troppo lungo."),
  scheduled_date: z.coerce.date({
    required_error: "La data pianificata è obbligatoria.",
    invalid_type_error: "La data pianificata non è valida.",
  }),
  status: z.enum(auditStatusValues).default("planned"),
});

export type CreateAuditSchema = z.infer<typeof createAuditSchema>;

