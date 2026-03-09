import { z } from "zod";
import { acStatusEnum } from "@/features/quality/schemas/nc-ac.schema";

export const createCorrectiveActionSchema = z.object({
  nonConformityId: z.string().uuid("Invalid non-conformity ID"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  rootCause: z.string().optional(),
  actionPlan: z.string().optional(),
  responsiblePersonName: z.string().optional(),
  responsiblePersonEmail: z.string().email().optional(),
  targetCompletionDate: z.string().date().optional(),
});

export const updateCorrectiveActionSchema = z.object({
  id: z.string().uuid("Invalid corrective action ID"),
  description: z.string().min(5).optional(),
  rootCause: z.string().optional(),
  actionPlan: z.string().optional(),
  responsiblePersonName: z.string().optional(),
  responsiblePersonEmail: z.string().email().optional(),
  dueDate: z.string().date().optional(),
  targetCompletionDate: z.string().date().optional(),
  status: acStatusEnum.optional(),
});

export const completeCorrectiveActionSchema = z.object({
  id: z.string().uuid("Invalid corrective action ID"),
});

export type CreateCorrectiveActionInput = z.infer<typeof createCorrectiveActionSchema>;
export type UpdateCorrectiveActionInput = z.infer<typeof updateCorrectiveActionSchema>;
export type CompleteCorrectiveActionInput = z.infer<typeof completeCorrectiveActionSchema>;
