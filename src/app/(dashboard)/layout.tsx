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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NetworkStatus } from "@/components/network-status";
import {
  ClipboardCheck,
  Home as HomeIcon,
  Menu,
  FlaskConical,
  GraduationCap,
  Building2,
  BriefcaseBusiness,
  Settings,
} from "lucide-react";

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

function getNavItems(role?: string | null): NavItem[] {
  if (role === "client") {
    // Client users see only the client dashboard
    return [
      { label: "Dashboard cliente", href: "/client-dashboard", icon: HomeIcon },
    ];
  }

  // Inspector and admin users see the full menu
  const items: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
    { label: "Audit", href: "/audits", icon: ClipboardCheck },
    { label: "Clienti", href: "/clients", icon: Building2 },
    { label: "Organizzazione", href: "/organization", icon: Building2 },
    { label: "Campionamenti", href: null, icon: FlaskConical, disabled: true },
    { label: "Formazione", href: null, icon: GraduationCap, disabled: true },
    { label: "Account", href: "/settings", icon: Settings },
  ];

  if (role === "admin") {
    items.splice(1, 0, {
      label: "Direzione",
      href: "/management",
      icon: BriefcaseBusiness,
    });
  }

  return items;
}

function NavLinks({ role }: { role?: string | null }) {
  const NAV_ITEMS = getNavItems(role);

  return (
    <nav className="flex-1 space-y-1 px-3 py-4">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;

        if (item.disabled) {
          return (
            <div
              key={item.label}
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
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 transition-colors"
          >
            <Icon className="h-4 w-4 text-zinc-500" />
            <span>{item.label}</span>
          </Link>
        );
      })}
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
                    <NavLinks role={dashboardUser.role} />
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
