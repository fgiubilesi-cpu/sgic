import { z } from 'zod';

const optionalTrimmedString = z.string().trim();
const optionalEmailString = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || z.string().email().safeParse(value).success,
    'Email non valida'
  );

export const clientSchema = z.object({
  name: z.string().trim().min(1, 'Nome cliente obbligatorio'),
  vat_number: optionalTrimmedString,
  email: optionalEmailString,
  phone: optionalTrimmedString,
  notes: optionalTrimmedString,
  is_active: z.boolean().default(true),
});

export const locationSchema = z.object({
  name: z.string().trim().min(1, 'Nome sede obbligatorio'),
  address: optionalTrimmedString,
  city: optionalTrimmedString,
  type: optionalTrimmedString,
  notes: optionalTrimmedString,
  is_active: z.boolean().default(true),
});

export type ClientFormInput = z.input<typeof clientSchema>;
export type LocationFormInput = z.input<typeof locationSchema>;
