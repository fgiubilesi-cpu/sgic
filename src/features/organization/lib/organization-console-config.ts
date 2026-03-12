import type { Json } from "@/types/database.types";

export type OrganizationProfileConfig = {
  legalAddress: string;
  officialEmail: string;
  officialPhone: string;
  qualityLeadEmail: string;
  qualityLeadName: string;
  reportFooter: string;
  reportHeader: string;
};

export type OrganizationRulesConfig = {
  auditAlertDays: number;
  defaultAuditGroupBy: "client" | "location" | "month" | "none" | "status";
  defaultAuditSort: "nc_desc" | "scheduled_asc" | "scheduled_desc" | "score_asc" | "score_desc" | "title_asc";
  defaultAuditView: "cards" | "table";
  documentAlertDays: number;
  scoreHealthyThreshold: number;
  scoreWarningThreshold: number;
  trainingAlertDays: number;
};

export type OrganizationBrandingConfig = {
  emailSignature: string;
  primaryColor: string;
  reportSubtitle: string;
  reportTitle: string;
};

export type OrganizationNotificationsConfig = {
  digestFrequency: "daily" | "off" | "weekly";
  recipients: string;
  sendAuditOverdue: boolean;
  sendAuditUpcoming: boolean;
  sendDocumentExpiry: boolean;
  sendOpenNonConformities: boolean;
  sendOverdueActions: boolean;
  sendTrainingExpiry: boolean;
};

export type OrganizationConsoleConfig = {
  branding: OrganizationBrandingConfig;
  notifications: OrganizationNotificationsConfig;
  profile: OrganizationProfileConfig;
  rules: OrganizationRulesConfig;
};

const defaults: OrganizationConsoleConfig = {
  profile: {
    legalAddress: "",
    officialEmail: "",
    officialPhone: "",
    qualityLeadEmail: "",
    qualityLeadName: "",
    reportFooter: "",
    reportHeader: "",
  },
  rules: {
    auditAlertDays: 7,
    defaultAuditGroupBy: "none",
    defaultAuditSort: "scheduled_desc",
    defaultAuditView: "table",
    documentAlertDays: 30,
    scoreHealthyThreshold: 85,
    scoreWarningThreshold: 70,
    trainingAlertDays: 30,
  },
  branding: {
    emailSignature: "",
    primaryColor: "#18181b",
    reportSubtitle: "ISO 9001 Audit Suite",
    reportTitle: "SGIC Report",
  },
  notifications: {
    digestFrequency: "weekly",
    recipients: "",
    sendAuditOverdue: true,
    sendAuditUpcoming: true,
    sendDocumentExpiry: true,
    sendOpenNonConformities: true,
    sendOverdueActions: true,
    sendTrainingExpiry: true,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeSection<T extends Record<string, unknown>>(base: T, source: unknown): T {
  if (!isRecord(source)) return { ...base };

  const output = { ...base };
  for (const key of Object.keys(base) as Array<keyof T>) {
    const nextValue = source[key as string];
    if (typeof base[key] === "boolean") {
      output[key] = (typeof nextValue === "boolean" ? nextValue : base[key]) as T[keyof T];
    } else if (typeof base[key] === "number") {
      output[key] = (typeof nextValue === "number" ? nextValue : base[key]) as T[keyof T];
    } else if (typeof base[key] === "string") {
      output[key] = (typeof nextValue === "string" ? nextValue : base[key]) as T[keyof T];
    } else {
      output[key] = base[key];
    }
  }

  return output;
}

export function getDefaultOrganizationConsoleConfig(): OrganizationConsoleConfig {
  return {
    profile: { ...defaults.profile },
    rules: { ...defaults.rules },
    branding: { ...defaults.branding },
    notifications: { ...defaults.notifications },
  };
}

export function parseOrganizationConsoleConfig(settings: Json | null | undefined): OrganizationConsoleConfig {
  const config = getDefaultOrganizationConsoleConfig();
  if (!isRecord(settings)) return config;

  return {
    profile: mergeSection(config.profile, settings.profile),
    rules: mergeSection(config.rules, settings.rules),
    branding: mergeSection(config.branding, settings.branding),
    notifications: mergeSection(config.notifications, settings.notifications),
  };
}

export function serializeOrganizationConsoleConfig(config: OrganizationConsoleConfig): Json {
  return {
    branding: config.branding,
    notifications: config.notifications,
    profile: config.profile,
    rules: config.rules,
  };
}
