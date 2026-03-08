import { z } from "zod";
import { ncSeverityEnum, ncStatusEnum } from "@/features/quality/schemas/nc-ac.schema";

export const createNonConformitySchema = z.object({
  auditId: z.string().uuid("Invalid audit ID"),
  checklistItemId: z.string().uuid("Invalid checklist item ID"),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().optional(),
  severity: ncSeverityEnum.default("major"),
});

export const updateNonConformitySchema = z.object({
  id: z.string().uuid("Invalid non-conformity ID"),
  title: z.string().min(3, "Title must be at least 3 characters").max(200).optional(),
  description: z.string().optional(),
  severity: ncSeverityEnum.optional(),
  status: ncStatusEnum.optional(),
});

export const closeNonConformitySchema = z.object({
  id: z.string().uuid("Invalid non-conformity ID"),
});

export type CreateNonConformityInput = z.infer<typeof createNonConformitySchema>;
export type UpdateNonConformityInput = z.infer<typeof updateNonConformitySchema>;
export type CloseNonConformityInput = z.infer<typeof closeNonConformitySchema>;
