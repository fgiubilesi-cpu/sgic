import { z } from "zod";

export const organizationUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Company name is required.")
    .max(120, "Company name is too long."),
  vat_number: z
    .string()
    .trim()
    .max(20, "VAT number is too long.")
    .optional()
    .or(z.literal("")),
  slug: z
    .string()
    .trim()
    .min(3, "Slug must be at least 3 characters.")
    .max(50, "Slug is too long.")
    .regex(
      /^[a-z0-9-]+$/,
      "Use only lowercase letters, numbers, and hyphens."
    ),
});

export type OrganizationUpdateInput = z.infer<typeof organizationUpdateSchema>;
