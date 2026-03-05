import { z } from "zod";

export const labResultSchema = z.object({
  sampling_id: z.string().uuid(),
  parameter: z.string().min(1, "Parameter is required"),
  uom: z.string().min(1, "Unit of measure is required"),
  result_value: z.number(),
  limit_value: z.number().optional().nullable(),
  outcome: z.enum(["pass", "fail", "pending"]).default("pending"),
});

export type LabResult = z.infer<typeof labResultSchema>;
