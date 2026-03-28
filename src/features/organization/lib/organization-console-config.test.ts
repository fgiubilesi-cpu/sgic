import { describe, expect, it } from "vitest";

import {
  getDefaultOrganizationConsoleConfig,
  parseOrganizationConsoleConfig,
  serializeOrganizationConsoleConfig,
} from "@/features/organization/lib/organization-console-config";

describe("organization-console-config", () => {
  it("returns isolated default copies", () => {
    const first = getDefaultOrganizationConsoleConfig();
    first.profile.legalAddress = "Via Roma 1";
    first.notifications.sendAuditOverdue = false;

    const second = getDefaultOrganizationConsoleConfig();

    expect(second.profile.legalAddress).toBe("");
    expect(second.notifications.sendAuditOverdue).toBe(true);
  });

  it("parses partial settings and ignores invalid primitive types", () => {
    const parsed = parseOrganizationConsoleConfig({
      branding: {
        primaryColor: "#0055aa",
        reportTitle: "GEA Console",
      },
      notifications: {
        audience: "admins",
        deliveryChannel: "dashboard",
        digestFrequency: "daily",
        minimumSeverity: "warning",
        recipients: "ops@example.com",
        sendAuditOverdue: false,
      },
      profile: {
        legalAddress: "Via Roma 1",
        officialEmail: 42,
      },
      rules: {
        auditAlertDays: 14,
        defaultAuditView: "cards",
        scoreHealthyThreshold: "90",
      },
    });

    expect(parsed.profile.legalAddress).toBe("Via Roma 1");
    expect(parsed.profile.officialEmail).toBe("");
    expect(parsed.rules.auditAlertDays).toBe(14);
    expect(parsed.rules.defaultAuditView).toBe("cards");
    expect(parsed.rules.scoreHealthyThreshold).toBe(85);
    expect(parsed.notifications.audience).toBe("admins");
    expect(parsed.notifications.deliveryChannel).toBe("dashboard");
    expect(parsed.notifications.minimumSeverity).toBe("warning");
    expect(parsed.notifications.sendAuditOverdue).toBe(false);
    expect(parsed.branding.primaryColor).toBe("#0055aa");
  });

  it("serializes the normalized config without dropping sections", () => {
    const config = parseOrganizationConsoleConfig({
      notifications: {
        recipients: "quality@example.com",
      },
      profile: {
        qualityLeadName: "Filippo",
      },
    });

    expect(serializeOrganizationConsoleConfig(config)).toEqual({
      branding: config.branding,
      notifications: config.notifications,
      profile: config.profile,
      rules: config.rules,
    });
  });
});
