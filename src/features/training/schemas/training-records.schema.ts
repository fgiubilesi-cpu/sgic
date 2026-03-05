import { z } from "zod";

export const trainingRecordSchema = z.object({
  personnel_id: z.string().min(1, "Personnel is required"),
  course_id: z.string().min(1, "Course is required"),
  completion_date: z.string(),
  expiry_date: z.string().nullable().optional(),
  certificate_url: z.string().optional().nullable(),
});

export type TrainingRecord = z.infer<typeof trainingRecordSchema>;
