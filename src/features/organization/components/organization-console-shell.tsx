import Link from "next/link";
import { ArrowRight, BadgeCheck, Building2, ClipboardList, ShieldCheck, Siren, SwatchBook, Waypoints } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Organization } from "@/features/organization/queries/get-organization";
import type { OrganizationConsoleOverview } from "@/features/organization/queries/get-organization-console";

type OrganizationConsoleTab = "profile" | "access" | "rules" | "branding" | "notifications" | "system";

const TAB_META: Array<{
  value: OrganizationConsoleTab;
  label: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    value: "profile",
    label: "Profilo",
    description: "Identita, dati legali e intestazioni base",
    icon: Building2,
  },
  {
    value: "access",
    label: "Utenti e ruoli",
    description: "Accessi, perimetro cliente e governance utenti",
    icon: ShieldCheck,
  },
  {
    value: "rules",
    label: "Regole",
    description: "Soglie, finestre scadenza e comportamenti default",
    icon: ClipboardList,
  },
  {
    value: "branding",
    label: "Branding e output",
    description: "Branding report, export e documenti",
    icon: SwatchBook,
  },
  {
    value: "notifications",
    label: "Notifiche",
    description: "Reminder, digest e trigger operativi",
    icon: Siren,
  },
  {
    value: "system",
    label: "Sistema",
    description: "Stato tenant, versione e salute operativa",
    icon: Waypoints,
  },
];

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "warning" | "danger";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3",
        tone === "danger"
          ? "border-red-200 bg-red-50"
          : tone === "warning"
            ? "border-amber-200 bg-amber-50"
            : "border-zinc-200 bg-white"
      )}
    >
      <p className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

export function OrganizationConsoleShell({
  accessContent,
  activeTab,
  brandingContent,
  notificationsContent,
  overview,
  organization,
  profileContent,
  rulesContent,
  systemContent,
}: {
  accessContent: React.ReactNode;
  activeTab: OrganizationConsoleTab;
  brandingContent: React.ReactNode;
  notificationsContent: React.ReactNode;
  overview: OrganizationConsoleOverview;
  organization: Organization;
  profileContent: React.ReactNode;
  rulesContent: React.ReactNode;
  systemContent: React.ReactNode;
}) {
  const activeTabMeta = TAB_META.find((tab) => tab.value === activeTab) ?? TAB_META[0];
  const doneCount = overview.setupItems.filter((item) => item.done).length;

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white via-white to-zinc-50 p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                Admin console
              </Badge>
              <Badge
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  overview.completionPercent >= 85
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : overview.completionPercent >= 50
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-red-200 bg-red-50 text-red-700"
                )}
              >
                {overview.statusLabel}
              </Badge>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
                {organization.name || "Organization"}
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-zinc-500">
                Console di governo del tenant: identita, accessi, regole operative, notifiche e salute del sistema.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
                Slug: <span className="font-medium text-zinc-900">{organization.slug || "non impostato"}</span>
              </span>
              <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
                Setup: <span className="font-medium text-zinc-900">{doneCount}/{overview.setupItems.length}</span>
              </span>
            </div>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[420px]">
            <MetricCard {...overview.metrics.users} />
            <MetricCard {...overview.metrics.clients} />
            <MetricCard {...overview.metrics.activeAudits} />
            <MetricCard {...overview.metrics.openNCs} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-zinc-400" />
              <CardTitle className="text-lg font-semibold">Tenant setup checklist</CardTitle>
            </div>
            <CardDescription>
              Una vista sintetica per capire se il tenant e configurato in modo amministrabile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {overview.setupItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 transition-colors",
                  item.done
                    ? "border-emerald-200 bg-emerald-50 hover:border-emerald-300"
                    : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white"
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                    <Badge
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        item.done
                          ? "border-emerald-200 bg-white text-emerald-700"
                          : "border-zinc-200 bg-white text-zinc-600"
                      )}
                    >
                      {item.done ? "Completo" : "Da fare"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
                </div>
                <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-300" />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Area attiva</CardTitle>
            <CardDescription>
              La console e organizzata per aree di governo, non come semplice pagina settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-sm font-semibold text-zinc-900">{activeTabMeta.label}</p>
              <p className="mt-1 text-xs text-zinc-500">{activeTabMeta.description}</p>
            </div>
            <div className="grid gap-2">
              <Button asChild className="justify-start">
                <Link href="/organization?tab=profile">Apri profilo tenant</Link>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/organization?tab=access">Apri utenti e ruoli</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-6">
          {TAB_META.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.value === activeTab;
            return (
              <Link
                key={tab.value}
                href={`/organization?tab=${tab.value}`}
                className={cn(
                  "rounded-xl border px-4 py-3 transition-colors",
                  isActive
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-transparent bg-zinc-50 text-zinc-700 hover:border-zinc-200 hover:bg-white"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <p className="text-sm font-semibold">{tab.label}</p>
                </div>
                <p className={cn("mt-1 text-[11px]", isActive ? "text-zinc-300" : "text-zinc-500")}>
                  {tab.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {activeTab === "profile" ? profileContent : null}
      {activeTab === "access" ? accessContent : null}

      {activeTab === "rules" ? rulesContent : null}
      {activeTab === "branding" ? brandingContent : null}
      {activeTab === "notifications" ? notificationsContent : null}
      {activeTab === "system" ? systemContent : null}
    </section>
  );
}
