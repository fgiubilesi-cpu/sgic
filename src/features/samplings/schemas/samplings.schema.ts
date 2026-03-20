import { z } from "zod";

export const samplingSchema = z.object({
  title: z.string().min(1, "Titolo obbligatorio"),
  matrix: z.string().min(1, "Matrice obbligatoria"),
  sampling_date: z.string().min(1, "Data campionamento obbligatoria"),
  client_id: z.string().optional().nullable(),
  location_id: z.string().optional().nullable(),
  operator_name: z.string().optional().nullable(),
  status: z.enum(["planned", "completed", "cancelled"]).default("planned"),
});

export type Sampling = z.infer<typeof samplingSchema>;
