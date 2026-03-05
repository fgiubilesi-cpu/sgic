import { z } from "zod";

export const trainingCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  duration_hours: z.number().int().min(1, "Duration must be at least 1 hour"),
  validity_months: z.number().int().min(1).nullable().optional(),
  category: z.enum(["safety", "quality", "technical", "other"]),
});

export type TrainingCourse = z.infer<typeof trainingCourseSchema>;
