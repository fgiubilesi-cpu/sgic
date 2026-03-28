import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserNav } from "@/features/auth/components/user-nav";
import { GlobalSearchLauncher } from "@/features/search/components/global-search-launcher";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NetworkStatus } from "@/components/network-status";
import {
  ClipboardCheck,
  FileText,
  Home as HomeIcon,
  Menu,
  FlaskConical,
  GraduationCap,
  Building2,
  BriefcaseBusiness,
  Settings,
  Users,
  Clock,
  ListTodo,
  BellRing,
  Scale,
} from "lucide-react";
import { ClientFilter } from "@/features/clients/components/client-filter";
import { getClientsList } from "@/features/clients/queries/get-clients-list";

type DashboardLayoutProps = {
  children: ReactNode;
};

type DashboardUser = {
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  role?: string | null;
};

type NavItem =
  | { label: string; href: string; icon: React.ElementType; disabled?: false }
  | { label: string; href: null; icon: React.ElementType; disabled: true };

type NavSection = {
  items: NavItem[];
  label: string;
};

function getNavSections(role?: string | null): NavSection[] {
  if (role === "client") {
    return [
      {
        label: "Workspace",
        items: [
          { label: "My Day", href: "/my-day", icon: ListTodo },
          { label: "Dashboard cliente", href: "/client-dashboard", icon: HomeIcon },
        ],
      },
    ];
  }

  return [
    {
      label: "Workspace",
      items: [
        { label: "My Day", href: "/my-day", icon: ListTodo },
        { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
        { label: "Notifiche", href: "/notifications", icon: BellRing },
      ],
    },
    {
      label: "Operativita",
      items: [
        { label: "Audit", href: "/audits", icon: ClipboardCheck },
        { label: "Campionamenti", href: "/samplings", icon: FlaskConical },
        { label: "Formazione", href: "/training", icon: GraduationCap },
        { label: "Scadenze", href: "/deadlines", icon: Clock },
      ],
    },
    {
      label: "Contesto",
      items: [
        { label: "Clienti", href: "/clients", icon: Building2 },
        { label: "Personale", href: "/personnel", icon: Users },
        { label: "Documenti", href: "/documents", icon: FileText },
        { label: "Normative", href: "/regulatory", icon: Scale },
      ],
    },
    {
      label: "Sistema",
      items: [
        ...(role === "admin"
          ? [
              {
                label: "Direzione",
                href: "/management",
                icon: BriefcaseBusiness,
              } satisfies NavItem,
            ]
          : []),
        { label: "Organizzazione", href: "/organization", icon: Building2 },
        { label: "Account", href: "/settings", icon: Settings },
      ],
    },
  ];
}

function NavLinkItem({ item }: { item: NavItem }) {
  const Icon = item.icon;

  if (item.disabled) {
    return (
      <div
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-400 cursor-not-allowed select-none"
        title="Prossimamente"
      >
        <Icon className="h-4 w-4 text-zinc-300" />
        <span className="flex-1">{item.label}</span>
        <Badge
          variant="secondary"
          className="text-[10px] px-1.5 py-0 h-4 bg-zinc-100 text-zinc-400 border-zinc-200"
        >
          presto
        </Badge>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
    >
      <Icon className="h-4 w-4 text-zinc-500" />
      <span>{item.label}</span>
    </Link>
  );
}

function NavLinks({
  role,
  mobile = false,
}: {
  role?: string | null;
  mobile?: boolean;
}) {
  const sections = getNavSections(role);

  if (mobile) {
    return (
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <Accordion
          type="multiple"
          defaultValue={sections.map((section) => section.label)}
          className="space-y-2"
        >
          {sections.map((section) => (
            <AccordionItem
              key={section.label}
              value={section.label}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-3"
            >
              <AccordionTrigger className="py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 hover:no-underline">
                {section.label}
              </AccordionTrigger>
              <AccordionContent className="pb-3">
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <NavLinkItem key={item.label} item={item} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </nav>
    );
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section.label} className="mb-5 last:mb-0">
          <div className="px-3 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
              {section.label}
            </span>
          </div>
          <div className="space-y-1">
            {section.items.map((item) => (
              <NavLinkItem key={item.label} item={item} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

function BrandLogo() {
  return (
    <div className="flex h-16 items-center gap-2 border-b px-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 text-white text-sm font-semibold">
        SG
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold tracking-tight">SGIC</span>
        <span className="text-xs text-zinc-500">ISO 9001 Audit Suite</span>
      </div>
    </div>
  );
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's role from profiles
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const dashboardUser: DashboardUser = {
    email: user.email ?? "",
    fullName:
      (user.user_metadata as Record<string, unknown> | null)?.full_name as
        | string
        | null ??
      ((user.user_metadata as Record<string, unknown> | null)?.name as
        | string
        | null ??
        null),
    avatarUrl:
      (user.user_metadata as Record<string, unknown> | null)?.avatar_url as
        | string
        | null ??
      null,
    role: profile?.role ?? null,
  };

  const clients = dashboardUser.role !== "client" ? await getClientsList() : [];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="flex h-screen">
        {/* Desktop sidebar */}
        <aside className="border-r bg-white/80 backdrop-blur-sm hidden md:flex md:w-64 md:flex-col">
          <BrandLogo />
          <NavLinks role={dashboardUser.role} />
          <div className="border-t px-4 py-3">
            <UserNav user={dashboardUser} />
          </div>
        </aside>

        {/* Content area */}
        <div className="flex flex-1 flex-col md:pl-0">
          {/* Top navbar */}
          <header className="flex h-16 items-center justify-between border-b bg-white/80 px-4 backdrop-blur-sm md:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="mr-1"
                      aria-label="Open navigation"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="flex w-72 flex-col p-0">
                    <BrandLogo />
                    <NavLinks role={dashboardUser.role} mobile />
                    <div className="border-t px-4 py-3">
                      <UserNav user={dashboardUser} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Breadcrumb */}
              <div className="flex flex-col gap-1">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <Link
                        href={dashboardUser.role === "client" ? "/client-dashboard" : "/dashboard"}
                        className="text-xs font-medium text-zinc-500 hover:text-zinc-700"
                      >
                        SGIC
                      </Link>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-xs font-medium">
                        {dashboardUser.role === "client" ? "Dashboard cliente" : "Pannello di controllo"}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <span className="text-sm font-semibold text-zinc-900">
                  {dashboardUser.role === "client" ? "Vista audit cliente" : "Pannello di controllo"}
                </span>
              </div>
            </div>

            {/* User menu desktop */}
            <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
              {clients.length > 0 && (
                <>
                  <ClientFilter clients={clients} />
                  <Separator orientation="vertical" className="h-6" />
                </>
              )}
              <NetworkStatus />
              <Separator orientation="vertical" className="h-6" />
              <GlobalSearchLauncher />
              <Separator orientation="vertical" className="h-6" />
              <UserNav user={dashboardUser} />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-zinc-50 px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
