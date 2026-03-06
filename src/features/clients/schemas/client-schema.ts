import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'Nome cliente obbligatorio'),
  vat_number: z.string().nullable().optional(),
  email: z.string().email('Email non valida').nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const locationSchema = z.object({
  name: z.string().min(1, 'Nome sede obbligatorio'),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  type: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export type ClientForm = z.infer<typeof clientSchema>;
export type LocationForm = z.infer<typeof locationSchema>;
