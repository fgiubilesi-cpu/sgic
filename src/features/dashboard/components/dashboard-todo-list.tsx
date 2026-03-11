import Link from "next/link";
import { ArrowRight, CircleDot } from "lucide-react";
import type { DashboardTodoItem } from "@/features/dashboard/queries/get-dashboard-data";
import { cn } from "@/lib/utils";

const priorityMeta: Record<DashboardTodoItem["priority"], { badge: string; dot: string }> = {
  urgent: {
    badge: "bg-red-100 text-red-700",
    dot: "text-red-500",
  },
  high: {
    badge: "bg-amber-100 text-amber-700",
    dot: "text-amber-500",
  },
  normal: {
    badge: "bg-zinc-100 text-zinc-700",
    dot: "text-zinc-400",
  },
};

export function DashboardTodoList({ todos }: { todos: DashboardTodoItem[] }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CircleDot className="h-4 w-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-900">To-do del giorno</h2>
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Azioni ordinate per priorita, derivate da audit, formazione e documenti.
          </p>
        </div>
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
          {todos.length} task
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {todos.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            Nessuna azione urgente. Puoi usare la dashboard come vista di controllo.
          </div>
        ) : (
          todos.map((todo) => (
            <Link
              key={todo.id}
              href={todo.href}
              className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-white"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{todo.title}</p>
                  {todo.badge ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-medium",
                        priorityMeta[todo.priority].badge
                      )}
                    >
                      {todo.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-zinc-500">{todo.description}</p>
              </div>
              <ArrowRight className={cn("mt-0.5 h-4 w-4 flex-shrink-0", priorityMeta[todo.priority].dot)} />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
