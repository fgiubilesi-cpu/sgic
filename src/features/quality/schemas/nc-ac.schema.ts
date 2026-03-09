import { z } from "zod";

export const ncSeverityEnum = z.enum(['critical', 'major', 'minor']);
export const ncStatusEnum = z.enum(['open', 'pending_verification', 'closed']);
export const acStatusEnum = z.enum(['open', 'completed', 'verified']);

export const nonConformitySchema = z.object({
    id: z.string().uuid().optional(),
    organization_id: z.string().uuid().optional(),
    title: z.string().min(1, "Il titolo è obbligatorio"),
    description: z.string().min(1, "La descrizione è obbligatoria"),
    identified_date: z.string().min(1, "La data di identificazione è obbligatoria"),
    severity: ncSeverityEnum.default('minor'),
    status: ncStatusEnum.default('open'),
    root_cause_analysis: z.string().optional(),
    action_plan: z.string().optional(),
});

export const correctiveActionSchema = z.object({
    id: z.string().uuid().optional(),
    organization_id: z.string().uuid().optional(),
    nc_id: z.string().uuid(),
    description: z.string().min(1, "La descrizione è obbligatoria"),
    due_date: z.string().optional().nullable(),
    status: acStatusEnum.default('open'),
});

export type NonConformity = z.infer<typeof nonConformitySchema>;
export type CorrectiveAction = z.infer<typeof correctiveActionSchema>;
export type NCSeverity = z.infer<typeof ncSeverityEnum>;
export type NCStatus = z.infer<typeof ncStatusEnum>;
export type ACStatus = z.infer<typeof acStatusEnum>;

// Aliases per compatibilità (alcuni file usano nomi leggermente diversi)
export type NCsSeverity = NCSeverity;
export type CorrectiveActionStatus = ACStatus;
