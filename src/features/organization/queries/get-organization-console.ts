import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { parseOrganizationConsoleConfig } from "@/features/organization/lib/organization-console-config";

export type OrganizationConsoleMetric = {
  label: string;
  tone: "default" | "warning" | "danger";
  value: number;
};

export type OrganizationSetupItem = {
  done: boolean;
  href: string;
  key: string;
  title: string;
  description: string;
};

export type OrganizationConsoleOverview = {
  completionPercent: number;
  metrics: {
    activeAudits: OrganizationConsoleMetric;
    clients: OrganizationConsoleMetric;
    openNCs: OrganizationConsoleMetric;
    users: OrganizationConsoleMetric;
  };
  setupItems: OrganizationSetupItem[];
  statusLabel: string;
};

export async function getOrganizationConsoleOverview(): Promise<OrganizationConsoleOverview | null> {
  const ctx = await getOrganizationContext();
  if (!ctx) return null;

  const { organizationId, supabase } = ctx;

  const [
    { count: usersCount },
    { count: clientsCount },
    { count: activeAuditsCount },
    { count: openNCsCount },
    { count: templatesCount },
    { count: documentsCount },
    { count: trainingCoursesCount },
    { data: organization },
    { data: roleSummaryRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("is_active", true),
    supabase
      .from("audits")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .in("status", ["Scheduled", "In Progress", "Review"]),
    supabase
      .from("non_conformities")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "open"),
    supabase
      .from("checklist_templates")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .eq("status", "published"),
    supabase
      .from("training_courses")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId),
    supabase
      .from("organizations")
      .select("name, slug, vat_number, logo_url, settings")
      .eq("id", organizationId)
      .single(),
    supabase
      .from("profiles")
      .select("role")
      .eq("organization_id", organizationId),
  ]);

  const adminCount = (roleSummaryRows ?? []).filter((row) => row.role === "admin").length;
  const operatorCount = (roleSummaryRows ?? []).filter((row) => row.role && row.role !== "admin").length;
  const config = parseOrganizationConsoleConfig(organization?.settings);

  const setupItems: OrganizationSetupItem[] = [
    {
      key: "profile",
      title: "Profilo organizzazione",
      description: "Nome, slug e P.IVA definiti per report e intestazioni.",
      done: Boolean(
        organization?.name &&
          organization?.slug &&
          organization?.vat_number &&
          config.profile.officialEmail &&
          config.profile.qualityLeadName
      ),
      href: "/organization?tab=profile",
    },
    {
      key: "admins",
      title: "Presidio admin",
      description: "Almeno un amministratore attivo governa il tenant.",
      done: adminCount > 0,
      href: "/organization?tab=access",
    },
    {
      key: "clients",
      title: "Perimetro clienti",
      description: "Esiste almeno un cliente attivo per operare nel tenant.",
      done: (clientsCount ?? 0) > 0,
      href: "/clients",
    },
    {
      key: "templates",
      title: "Template audit",
      description: "Almeno un template pronto per generare checklist operative.",
      done: (templatesCount ?? 0) > 0,
      href: "/templates",
    },
    {
      key: "documents",
      title: "Workspace documentale",
      description: "Almeno un documento pubblicato o un corso formazione configurato.",
      done:
        ((documentsCount ?? 0) > 0 || (trainingCoursesCount ?? 0) > 0) &&
        Boolean(organization?.logo_url || config.branding.reportTitle),
      href: "/organization?tab=branding",
    },
    {
      key: "operators",
      title: "Team operativo",
      description: "Esiste almeno un utente non admin che usera il sistema.",
      done: operatorCount > 0,
      href: "/organization?tab=access",
    },
    {
      key: "notifications",
      title: "Notifiche tenant",
      description: "Esiste almeno un destinatario digest o una policy notifiche definita.",
      done:
        config.notifications.digestFrequency === "off" ||
        config.notifications.recipients.trim().length > 0,
      href: "/organization?tab=notifications",
    },
  ];

  const doneCount = setupItems.filter((item) => item.done).length;
  const completionPercent = Math.round((doneCount / setupItems.length) * 100);

  const statusLabel =
    completionPercent >= 85
      ? "Tenant pronto"
      : completionPercent >= 50
        ? "Tenant in allestimento"
        : "Setup iniziale incompleto";

  return {
    completionPercent,
    metrics: {
      users: {
        label: "Utenti attivi",
        tone: (usersCount ?? 0) > 1 ? "default" : "warning",
        value: usersCount ?? 0,
      },
      clients: {
        label: "Clienti attivi",
        tone: (clientsCount ?? 0) > 0 ? "default" : "warning",
        value: clientsCount ?? 0,
      },
      activeAudits: {
        label: "Audit aperti",
        tone: (activeAuditsCount ?? 0) > 0 ? "default" : "warning",
        value: activeAuditsCount ?? 0,
      },
      openNCs: {
        label: "NC aperte",
        tone: (openNCsCount ?? 0) > 0 ? "danger" : "default",
        value: openNCsCount ?? 0,
      },
    },
    setupItems,
    statusLabel,
  };
}
