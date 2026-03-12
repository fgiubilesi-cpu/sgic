import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { getOrganization } from "@/features/organization/queries/get-organization";
import { getOrganizationAccessOverview } from "@/features/organization/queries/get-organization-access";
import { getOrganizationConsoleOverview } from "@/features/organization/queries/get-organization-console";
import { getOrganizationSystemSnapshot } from "@/features/organization/queries/get-organization-system-snapshot";
import { OrganizationConsoleShell } from "@/features/organization/components/organization-console-shell";
import { OrganizationAccessPanel } from "@/features/organization/components/organization-access-panel";
import { OrganizationProfilePanel } from "@/features/organization/components/organization-profile-panel";
import { OrganizationRulesPanel } from "@/features/organization/components/organization-rules-panel";
import { OrganizationBrandingPanel } from "@/features/organization/components/organization-branding-panel";
import { OrganizationNotificationsPanel } from "@/features/organization/components/organization-notifications-panel";
import { OrganizationSystemPanel } from "@/features/organization/components/organization-system-panel";

type OrganizationPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrganizationPage({ searchParams }: OrganizationPageProps) {
  const params = await searchParams;
  const activeTab =
    typeof params.tab === "string" &&
    ["profile", "access", "rules", "branding", "notifications", "system"].includes(params.tab)
      ? (params.tab as "profile" | "access" | "rules" | "branding" | "notifications" | "system")
      : "profile";

  const [organization, accessOverview, consoleOverview, systemSnapshot] = await Promise.all([
    getOrganization(),
    getOrganizationAccessOverview(),
    getOrganizationConsoleOverview(),
    getOrganizationSystemSnapshot(),
  ]);

  if (!organization) {
    return (
      <section className="max-w-2xl space-y-4">
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="flex flex-row items-start gap-3 space-y-0">
            <div className="mt-1 rounded-full bg-amber-100 p-1.5 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-amber-900">
                No organisation found
              </CardTitle>
              <CardDescription className="pt-1 text-sm text-amber-800">
                Your profile is not linked to any organisation. Please contact your
                SGIC administrator to complete the tenant setup.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </section>
    );
  }

  const canManage = accessOverview?.canManageAccess ?? false;

  return (
    <OrganizationConsoleShell
      activeTab={activeTab}
      accessContent={accessOverview ? <OrganizationAccessPanel overview={accessOverview} /> : null}
      brandingContent={
        <OrganizationBrandingPanel
          canManage={canManage}
          initialValues={{
            emailSignature: organization.config.branding.emailSignature,
            logoUrl: organization.logo_url ?? "",
            primaryColor: organization.config.branding.primaryColor,
            reportSubtitle: organization.config.branding.reportSubtitle,
            reportTitle: organization.config.branding.reportTitle,
          }}
        />
      }
      notificationsContent={
        <OrganizationNotificationsPanel
          canManage={canManage}
          initialValues={organization.config.notifications}
        />
      }
      organization={organization}
      overview={
        consoleOverview ?? {
          completionPercent: 0,
          metrics: {
            users: { label: "Utenti attivi", tone: "warning", value: 0 },
            clients: { label: "Clienti attivi", tone: "warning", value: 0 },
            activeAudits: { label: "Audit aperti", tone: "warning", value: 0 },
            openNCs: { label: "NC aperte", tone: "default", value: 0 },
          },
          setupItems: [],
          statusLabel: "Tenant da configurare",
        }
      }
      profileContent={<OrganizationProfilePanel canManage={canManage} organization={organization} />}
      rulesContent={
        <OrganizationRulesPanel
          canManage={canManage}
          initialValues={organization.config.rules}
        />
      }
      systemContent={
        systemSnapshot ? <OrganizationSystemPanel snapshot={systemSnapshot} /> : null
      }
    />
  );
}
