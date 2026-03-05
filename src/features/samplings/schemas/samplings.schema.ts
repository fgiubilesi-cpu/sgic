import { z } from "zod";

export const samplingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  matrix: z.string().min(1, "Matrix is required"),
  sampling_date: z.string(),
  location: z.string().optional().nullable(),
  operator_name: z.string().optional().nullable(),
  status: z.enum(["planned", "completed", "cancelled"]).default("planned"),
});

export type Sampling = z.infer<typeof samplingSchema>;
