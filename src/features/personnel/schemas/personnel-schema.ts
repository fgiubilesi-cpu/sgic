import { z } from 'zod';

export const personnelSchema = z.object({
  first_name: z.string().trim().min(1, 'Nome obbligatorio'),
  last_name: z.string().trim().min(1, 'Cognome obbligatorio'),
  role: z.string().trim().min(1, 'Ruolo obbligatorio'),
  email: z.string().trim().min(1, 'Email obbligatoria').email('Email non valida'),
  client_id: z.string().uuid('Cliente non valido'),
  location_id: z.string().trim(),
  tax_code: z.string().trim(),
  hire_date: z.string().trim(),
  is_active: z.boolean().default(true),
});

export type PersonnelFormInput = z.input<typeof personnelSchema>;
