import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getOrganization } from "@/features/organization/queries/get-organization";
import { OrgSettingsForm } from "@/features/organization/components/org-settings-form";

export default async function OrganizationPage() {
  const organization = await getOrganization();

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
                Nessuna organizzazione trovata
              </CardTitle>
              <CardDescription className="pt-1 text-sm text-amber-800">
                Il tuo profilo non risulta collegato ad alcuna organizzazione. Contatta
                l&apos;amministratore SGIC per completare la configurazione del tenant.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
          Organizzazione
        </h1>
        <p className="text-sm text-zinc-500">
          Gestisci le informazioni anagrafiche della tua organizzazione. Questi dati
          vengono utilizzati per audit, report e tracciabilità ISO 9001.
        </p>
      </div>

      <OrgSettingsForm organization={organization} />
    </section>
  );
}

