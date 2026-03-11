import { z } from 'zod';

export const documentSchema = z.object({
  category: z.enum(['Procedure', 'Manual', 'Instruction', 'Form']),
  client_id: z.string().trim(),
  description: z.string().trim(),
  expiry_date: z.string().trim(),
  file_url: z.string().trim().url('Inserisci un URL valido').or(z.literal('')),
  issue_date: z.string().trim(),
  location_id: z.string().trim(),
  personnel_id: z.string().trim(),
  status: z.enum(['draft', 'published', 'archived']),
  title: z.string().trim().min(1, 'Titolo obbligatorio'),
  version: z.string().trim(),
});

export type DocumentFormInput = z.input<typeof documentSchema>;
