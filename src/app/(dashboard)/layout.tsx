import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { UserNav } from "@/features/auth/components/user-nav";
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
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  ClipboardCheck,
  Home as HomeIcon,
  Menu,
  Settings,
  Layout, // <--- AGGIUNTO
} from "lucide-react";

type DashboardLayoutProps = {
  children: ReactNode;
};

type DashboardUser = {
  email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
};

const NAV_ITEMS: Array<{
  label: string;
  href: string;
  icon: React.ElementType;
}> = [
  {
    label: "Dashboard",
    href: "/",
    icon: HomeIcon,
  },
  {
    label: "Audits",
    href: "/audits",
    icon: ClipboardCheck,
  },
  {
    label: "Template Checklist", // <--- AGGIUNTO
    href: "/templates",          // <--- AGGIUNTO
    icon: Layout,                // <--- AGGIUNTO
  },
  {
    label: "Organizzazione",
    href: "/organization",
    icon: Building2,
  },
  {
    label: "Impostazioni",
    href: "/impostazioni",
    icon: Settings,
  },
];

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
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <div className="flex h-screen">
        {/* Sidebar desktop */}
        <aside className="border-r bg-white/80 backdrop-blur-sm hidden md:flex md:w-64 md:flex-col">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 text-white text-sm font-semibold">
              SG
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                SGIC
              </span>
              <span className="text-xs text-zinc-500">
                ISO 9001 Audit Suite
              </span>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
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
                      aria-label="Apri navigazione"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="flex w-72 flex-col p-0">
                    <div className="flex h-16 items-center gap-2 border-b px-6">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-900 text-white text-sm font-semibold">
                        SG
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold tracking-tight">
                          SGIC
                        </span>
                        <span className="text-xs text-zinc-500">
                          ISO 9001 Audit Suite
                        </span>
                      </div>
                    </div>
                    <nav className="flex-1 space-y-1 px-3 py-4">
                      {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
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
                        href="/"
                        className="text-xs font-medium text-zinc-500 hover:text-zinc-700"
                      >
                        SGIC
                      </Link>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-xs font-medium">
                        Dashboard
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                <span className="text-sm font-semibold text-zinc-900">
                  Pannello di controllo
                </span>
              </div>
            </div>

            {/* User menu desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Separator orientation="vertical" className="h-6" />
              <UserNav user={dashboardUser} />
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 overflow-y-auto bg-zinc-50 px-4 py-6 md:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}