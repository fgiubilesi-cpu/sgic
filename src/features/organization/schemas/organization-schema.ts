import { z } from "zod";

export const organizationUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Il nome dell'azienda è obbligatorio.")
    .max(120, "Il nome dell'azienda è troppo lungo."),
  vat_number: z
    .string()
    .trim()
    .max(20, "La partita IVA è troppo lunga.")
    .optional()
    .or(z.literal("")),
  slug: z
    .string()
    .trim()
    .min(3, "Lo slug deve avere almeno 3 caratteri.")
    .max(50, "Lo slug è troppo lungo.")
    .regex(
      /^[a-z0-9-]+$/,
      "Usa solo lettere minuscole, numeri e trattini."
    ),
});

export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;

