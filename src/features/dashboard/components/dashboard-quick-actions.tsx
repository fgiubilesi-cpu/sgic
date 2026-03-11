import Link from "next/link";
import { ArrowUpRight, ClipboardCheck, FileSearch, FolderKanban, Users } from "lucide-react";

const actions = [
  {
    href: "/audits",
    icon: ClipboardCheck,
    title: "Pianifica audit",
    description: "Apri la vista audit con filtri, gruppi e gestione rapida.",
  },
  {
    href: "/clients",
    icon: Users,
    title: "Apri hub clienti",
    description: "Gestisci anagrafica, sedi, collaboratori e documenti.",
  },
  {
    href: "/search",
    icon: FileSearch,
    title: "Ricerca globale",
    description: "Trova rapidamente audit, clienti, collaboratori e documenti.",
  },
  {
    href: "/non-conformities",
    icon: FolderKanban,
    title: "Controlla NC",
    description: "Rientra sulle non conformita aperte e sulle azioni correttive.",
  },
];

export function DashboardQuickActions() {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900">Azioni rapide</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Scorciatoie operative per passare dal controllo all&apos;azione.
        </p>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 transition-colors hover:border-zinc-300 hover:bg-white"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-full bg-zinc-900/5 p-2 text-zinc-700">
                  <Icon className="h-4 w-4" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-zinc-300" />
              </div>
              <p className="mt-3 text-sm font-semibold text-zinc-900">{action.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{action.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
