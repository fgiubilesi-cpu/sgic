import { z } from 'zod';

const dateString = z
  .string()
  .trim()
  .optional()
  .nullable();

const textOptional = z
  .string()
  .trim()
  .optional()
  .nullable();

export const documentCategorySchema = z.enum([
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
]);

export const contractProposalSchema = z.object({
  activity_frequency: textOptional,
  contract_type: textOptional,
  end_date: dateString,
  internal_owner: textOptional,
  notes: textOptional,
  renewal_date: dateString,
  service_scope: textOptional,
  start_date: dateString,
});

export const contactProposalSchema = z.object({
  department: textOptional,
  email: textOptional,
  full_name: textOptional,
  is_primary: z.boolean().optional(),
  location_hint: textOptional,
  phone: textOptional,
  role: textOptional,
});

export const deadlineProposalSchema = z.object({
  description: textOptional,
  due_date: dateString,
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  title: textOptional,
});

export const serviceLineProposalSchema = z.object({
  billing_phase: textOptional,
  code: textOptional,
  frequency_label: textOptional,
  is_recurring: z.boolean().optional(),
  notes: textOptional,
  quantity: textOptional,
  section: textOptional,
  title: textOptional,
  total_price: textOptional,
  unit: textOptional,
  unit_price: textOptional,
});

export const documentIntakeProposalSchema = z.object({
  confidence: z.enum(['low', 'medium', 'high']).default('medium'),
  contract: contractProposalSchema.optional(),
  contacts: z.array(contactProposalSchema).optional(),
  deadline: deadlineProposalSchema.optional(),
  manual: z
    .object({
      applicable_scope: textOptional,
      owner: textOptional,
      review_date: dateString,
      revision: textOptional,
    })
    .optional(),
  service_lines: z.array(serviceLineProposalSchema).optional(),
  parser: z.string().trim().default('manual'),
  summary: z.string().trim().default(''),
});

export const documentIntakeReviewSchema = z.object({
  action: z.enum(['save_review', 'apply_to_workspace']).default('save_review'),
  category: documentCategorySchema,
  create_followup_task: z.boolean().optional().default(false),
  proposal: documentIntakeProposalSchema,
  reviewer_notes: z.string().trim().max(4000).default(''),
});

export type DocumentIntakeReviewInput = z.input<typeof documentIntakeReviewSchema>;
export type DocumentIntakeReviewValues = z.output<typeof documentIntakeReviewSchema>;
