import { z } from 'zod';

export const documentSchema = z.object({
  category: z.enum([
    'Procedure',
    'Manual',
    'Instruction',
    'Form',
    'Contract',
    'Certificate',
    'Other',
    'OrgChart',
    'Authorization',
    'Registry',
    'Report',
  ]),
  client_id: z.string().trim(),
  description: z.string().trim(),
  expiry_date: z.string().trim(),
  extracted_payload: z.unknown().nullable().optional(),
  file_name: z.string().trim().optional(),
  file_size_bytes: z.number().int().nonnegative().nullable().optional(),
  file_url: z.string().trim().url('Inserisci un URL valido').or(z.literal('')),
  ingestion_status: z
    .enum(['manual', 'uploaded', 'parsed', 'review_required', 'reviewed', 'linked', 'failed'])
    .optional(),
  issue_date: z.string().trim(),
  location_id: z.string().trim(),
  mime_type: z.string().trim().optional(),
  personnel_id: z.string().trim(),
  storage_path: z.string().trim().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  title: z.string().trim().min(1, 'Titolo obbligatorio'),
  version: z.string().trim(),
});

export type DocumentFormInput = z.input<typeof documentSchema>;
export type DocumentFormValues = z.output<typeof documentSchema>;
