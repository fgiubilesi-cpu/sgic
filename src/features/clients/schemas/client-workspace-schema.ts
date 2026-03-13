import { z } from 'zod';

const optionalText = z.string().trim();

export const clientContractSchema = z.object({
  client_references: optionalText,
  contract_type: z.string().trim().min(1, 'Tipo contratto obbligatorio'),
  duration_terms: optionalText,
  status: z.enum(['draft', 'active', 'paused', 'expired']),
  start_date: optionalText,
  issue_date: optionalText,
  renewal_date: optionalText,
  end_date: optionalText,
  exercised_activity: optionalText,
  protocol_code: optionalText,
  service_scope: optionalText,
  supervisor_name: optionalText,
  activity_frequency: optionalText,
  internal_owner: optionalText,
  validity_terms: optionalText,
  notes: optionalText,
  attachment_url: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || z.string().url().safeParse(value).success,
      'Inserisci un URL valido'
    ),
});

export const clientTaskSchema = z.object({
  title: z.string().trim().min(1, 'Titolo obbligatorio'),
  description: optionalText,
  status: z.enum(['open', 'in_progress', 'blocked', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  due_date: optionalText,
  owner_name: optionalText,
  location_id: optionalText,
  audit_id: optionalText,
  service_line_id: optionalText,
  is_recurring: z.boolean().default(false),
  recurrence_label: optionalText,
});

export const clientContactSchema = z.object({
  full_name: z.string().trim().min(1, 'Nome contatto obbligatorio'),
  role: optionalText,
  department: optionalText,
  email: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || z.string().email().safeParse(value).success,
      'Email non valida'
    ),
  phone: optionalText,
  location_id: optionalText,
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
  notes: optionalText,
});

export const clientDeadlineSchema = z.object({
  title: z.string().trim().min(1, 'Titolo scadenza obbligatorio'),
  description: optionalText,
  due_date: z.string().trim().min(1, 'Data scadenza obbligatoria'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  status: z.enum(['open', 'completed', 'cancelled']).default('open'),
  location_id: optionalText,
  service_line_id: optionalText,
});

export const clientNoteSchema = z.object({
  title: z.string().trim().min(1, 'Titolo nota obbligatorio'),
  body: z.string().trim().min(1, 'Contenuto obbligatorio'),
  note_type: z.enum(['operational', 'warning', 'decision', 'info']),
  pinned: z.boolean().default(false),
  location_id: optionalText,
});

export type ClientContractInput = z.input<typeof clientContractSchema>;
export type ClientTaskInput = z.input<typeof clientTaskSchema>;
export type ClientContactInput = z.input<typeof clientContactSchema>;
export type ClientDeadlineInput = z.input<typeof clientDeadlineSchema>;
export type ClientNoteInput = z.input<typeof clientNoteSchema>;
