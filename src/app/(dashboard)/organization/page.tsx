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

function OrganizationDataUnavailable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <div className="mt-1 rounded-full bg-amber-100 p-1.5 text-amber-700">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <CardTitle className="text-sm font-semibold text-amber-900">
            {title}
          </CardTitle>
          <CardDescription className="pt-1 text-sm text-amber-800">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  );
}

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
  const canManageConsole = canManage && organization.consoleStorageReady;

  return (
    <section className="space-y-4">
      {!organization.consoleStorageReady ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm font-semibold text-amber-900">
              Organization console in modalita compatibile
            </CardTitle>
            <CardDescription className="text-sm text-amber-800">
              L&apos;organizzazione esiste, ma il database non ha ancora le colonne `settings` e `logo_url`
              richieste dalla nuova console. La pagina resta accessibile in lettura e i salvataggi avanzati
              sono temporaneamente disabilitati finche non applichi la migration
              `20260312090000_add_organization_console_settings.sql`.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <OrganizationConsoleShell
        activeTab={activeTab}
        accessContent={
          accessOverview ? (
            <OrganizationAccessPanel overview={accessOverview} />
          ) : (
            <OrganizationDataUnavailable
              title="Accessi temporaneamente non disponibili"
              description="La console organizzazione è raggiungibile, ma il riepilogo utenti o clienti non è disponibile in questo ambiente. Verifica che lo schema tenant sia allineato e riprova."
            />
          )
        }
        brandingContent={
          <OrganizationBrandingPanel
            canManage={canManageConsole}
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
            canManage={canManageConsole}
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
        profileContent={
          <OrganizationProfilePanel
            canManageConsole={canManageConsole}
            canManageIdentity={canManage}
            organization={organization}
          />
        }
        rulesContent={
          <OrganizationRulesPanel
            canManage={canManageConsole}
            initialValues={organization.config.rules}
          />
        }
        systemContent={
          systemSnapshot ? (
            <OrganizationSystemPanel snapshot={systemSnapshot} />
          ) : (
            <OrganizationDataUnavailable
              title="Snapshot sistema non disponibile"
              description="Non siamo riusciti a leggere il contesto di release o migrazioni locali. La console resta accessibile, ma questo pannello richiede un nuovo tentativo."
            />
          )
        }
      />
    </section>
  );
}
