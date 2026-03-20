import { z } from "zod";

export const medicalVisitSchema = z.object({
  visit_date: z.string().min(1, "Data visita obbligatoria"),
  expiry_date: z.string().optional().nullable(),
  fitness_status: z.enum(["fit", "fit_with_limitations", "unfit", "pending"]).default("fit"),
  limitations: z.string().optional().nullable(),
  doctor_name: z.string().optional().nullable(),
  protocol: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type MedicalVisitFormInput = z.input<typeof medicalVisitSchema>;
