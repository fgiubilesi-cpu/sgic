import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import type { DashboardNotification } from "@/features/dashboard/queries/get-dashboard-data";
import { cn } from "@/lib/utils";

const toneClasses: Record<DashboardNotification["tone"], string> = {
  default: "border-zinc-200 bg-zinc-50 text-zinc-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-red-200 bg-red-50 text-red-800",
};

export function DashboardNotificationCenter({
  notifications,
}: {
  notifications: DashboardNotification[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900">Inbox operativa</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Segnali aggregati dalle aree che richiedono attenzione immediata.
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
          {notifications.length} attive
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Nessuna criticita rilevata nel perimetro corrente.
          </div>
        ) : (
          notifications.map((notification) => (
            <Link
              key={notification.id}
              href={notification.href}
              className={cn(
                "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors hover:border-zinc-300",
                toneClasses[notification.tone]
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold">{notification.title}</p>
                <p className="mt-1 text-xs opacity-90">{notification.description}</p>
              </div>
              <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0" />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
