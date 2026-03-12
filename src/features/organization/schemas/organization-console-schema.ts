import { z } from "zod";

const optionalTextField = (max: number, message: string) =>
  z.union([z.string().trim().max(max, message), z.literal("")]).default("");

const optionalEmailField = () =>
  z.union([z.string().trim().email("Email non valida."), z.literal("")]).default("");

export const organizationProfileDetailsSchema = z.object({
  legalAddress: optionalTextField(240, "Indirizzo troppo lungo."),
  officialEmail: optionalEmailField(),
  officialPhone: optionalTextField(40, "Telefono troppo lungo."),
  qualityLeadEmail: optionalEmailField(),
  qualityLeadName: optionalTextField(120, "Nome troppo lungo."),
  reportFooter: optionalTextField(240, "Footer troppo lungo."),
  reportHeader: optionalTextField(240, "Intestazione troppo lunga."),
});

export const organizationRulesSchema = z.object({
  auditAlertDays: z.coerce.number().int().min(1).max(90),
  defaultAuditGroupBy: z.enum(["none", "month", "client", "location", "status"]),
  defaultAuditSort: z.enum(["scheduled_desc", "scheduled_asc", "score_desc", "score_asc", "nc_desc", "title_asc"]),
  defaultAuditView: z.enum(["table", "cards"]),
  documentAlertDays: z.coerce.number().int().min(1).max(180),
  scoreHealthyThreshold: z.coerce.number().int().min(50).max(100),
  scoreWarningThreshold: z.coerce.number().int().min(0).max(100),
  trainingAlertDays: z.coerce.number().int().min(1).max(180),
}).superRefine((value, ctx) => {
  if (value.scoreWarningThreshold >= value.scoreHealthyThreshold) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La soglia warning deve essere inferiore alla soglia healthy.",
      path: ["scoreWarningThreshold"],
    });
  }
});

export const organizationBrandingSchema = z.object({
  emailSignature: optionalTextField(500, "Firma troppo lunga."),
  logoUrl: z.union([z.string().trim().url("URL logo non valido."), z.literal("")]).default(""),
  primaryColor: z.string().trim().regex(/^#([0-9a-fA-F]{6})$/, "Usa un colore esadecimale valido."),
  reportSubtitle: optionalTextField(160, "Sottotitolo troppo lungo."),
  reportTitle: z.string().trim().max(120, "Titolo troppo lungo."),
});

export const organizationNotificationsSchema = z.object({
  digestFrequency: z.enum(["off", "daily", "weekly"]),
  recipients: z.string().trim().max(500, "Troppi destinatari."),
  sendAuditOverdue: z.boolean(),
  sendAuditUpcoming: z.boolean(),
  sendDocumentExpiry: z.boolean(),
  sendOpenNonConformities: z.boolean(),
  sendOverdueActions: z.boolean(),
  sendTrainingExpiry: z.boolean(),
});

export type OrganizationProfileDetailsInput = z.input<typeof organizationProfileDetailsSchema>;
export type OrganizationRulesInput = z.input<typeof organizationRulesSchema>;
export type OrganizationBrandingInput = z.input<typeof organizationBrandingSchema>;
export type OrganizationNotificationsInput = z.input<typeof organizationNotificationsSchema>;
export type OrganizationProfileDetailsValues = z.output<typeof organizationProfileDetailsSchema>;
export type OrganizationRulesValues = z.output<typeof organizationRulesSchema>;
export type OrganizationBrandingValues = z.output<typeof organizationBrandingSchema>;
export type OrganizationNotificationsValues = z.output<typeof organizationNotificationsSchema>;
