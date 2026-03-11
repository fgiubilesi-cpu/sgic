"use client";

import type { ElementType } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, CalendarRange, RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type SavedViewId = "all" | "today" | "week" | "month";

const VIEW_META: Record<
  SavedViewId,
  { icon: ElementType; label: string; description: string }
> = {
  all: {
    icon: RotateCcw,
    label: "Panoramica",
    description: "Vista completa senza range date",
  },
  today: {
    icon: Sparkles,
    label: "Oggi",
    description: "Focus sugli audit di oggi",
  },
  week: {
    icon: CalendarClock,
    label: "Settimana operativa",
    description: "Prossimi 7 giorni",
  },
  month: {
    icon: CalendarRange,
    label: "Ultimi 30 giorni",
    description: "Storico operativo recente",
  },
};

function formatIsoDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function getDatesForView(view: SavedViewId) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (view === "today") {
    const value = formatIsoDate(start);
    return { dateFrom: value, dateTo: value };
  }

  if (view === "week") {
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return {
      dateFrom: formatIsoDate(start),
      dateTo: formatIsoDate(end),
    };
  }

  if (view === "month") {
    const from = new Date(start);
    from.setDate(from.getDate() - 30);
    return {
      dateFrom: formatIsoDate(from),
      dateTo: formatIsoDate(start),
    };
  }

  return { dateFrom: "", dateTo: "" };
}

function resolveCurrentView(dateFrom: string, dateTo: string): SavedViewId {
  const today = formatIsoDate(new Date());

  if (!dateFrom && !dateTo) return "all";
  if (dateFrom === today && dateTo === today) return "today";

  return "all";
}

export function DashboardSavedViews({
  activeDateFrom,
  activeDateTo,
}: {
  activeDateFrom: string;
  activeDateTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeView = resolveCurrentView(activeDateFrom, activeDateTo);

  function applyView(view: SavedViewId) {
    const params = new URLSearchParams(searchParams.toString());
    const { dateFrom, dateTo } = getDatesForView(view);

    if (dateFrom) {
      params.set("dateFrom", dateFrom);
    } else {
      params.delete("dateFrom");
    }

    if (dateTo) {
      params.set("dateTo", dateTo);
    } else {
      params.delete("dateTo");
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(nextUrl);
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {(Object.keys(VIEW_META) as SavedViewId[]).map((viewId) => {
        const meta = VIEW_META[viewId];
        const Icon = meta.icon;
        const isActive =
          activeView === viewId ||
          (viewId === "week" &&
            activeView === "all" &&
            activeDateFrom !== "" &&
            activeDateTo !== "" &&
            activeDateFrom !== activeDateTo);

        return (
          <button
            key={viewId}
            type="button"
            onClick={() => applyView(viewId)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-colors",
              isActive
                ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                : "border-zinc-200 bg-white text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{meta.label}</p>
                <p
                  className={cn(
                    "mt-1 text-xs",
                    isActive ? "text-zinc-300" : "text-zinc-500"
                  )}
                >
                  {meta.description}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full",
                  isActive ? "bg-white/10 text-white" : "bg-zinc-100 text-zinc-600"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
