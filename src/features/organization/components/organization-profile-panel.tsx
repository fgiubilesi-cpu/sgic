import { Building2, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrgSettingsForm } from "@/features/organization/components/org-settings-form";
import { OrganizationProfileDetailsForm } from "@/features/organization/components/organization-profile-details-form";
import type { Organization } from "@/features/organization/queries/get-organization";

export function OrganizationProfilePanel({
  canManage,
  organization,
}: {
  canManage: boolean;
  organization: Organization;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <OrgSettingsForm canManage={canManage} organization={organization} />
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Uso del profilo</CardTitle>
            <CardDescription>
              Questa sezione governa l&apos;identita con cui SGIC si presenta in audit, export e documenti.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-zinc-400" />
                <p className="text-sm font-semibold text-zinc-900">Identita tenant</p>
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                Nome, slug e P.IVA definiscono l&apos;identita legale e operativa del tenant all&apos;interno di SGIC.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-zinc-400" />
                <p className="text-sm font-semibold text-zinc-900">Output documentali</p>
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                Le informazioni del profilo vengono riusate in report, documenti, dashboard e intestazioni esportabili.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <OrganizationProfileDetailsForm
        canManage={canManage}
        initialValues={organization.config.profile}
      />
    </div>
  );
}
