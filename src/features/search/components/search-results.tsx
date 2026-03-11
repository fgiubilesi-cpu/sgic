import Link from "next/link";
import { ArrowRight, Building2, ClipboardCheck, FileText, MapPin, Users } from "lucide-react";
import type { GlobalSearchResults } from "@/features/search/queries/get-global-search-results";

function Section({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: GlobalSearchResults[keyof GlobalSearchResults];
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="text-zinc-400">{icon}</span>
        <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      </div>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-zinc-400">Nessun risultato in questa sezione.</p>
        ) : (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 transition-colors hover:border-zinc-300 hover:bg-white"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.subtitle}</p>
                {item.meta ? (
                  <p className="mt-1 text-[11px] font-medium text-zinc-400">{item.meta}</p>
                ) : null}
              </div>
              <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-zinc-300" />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

export function SearchResults({
  query,
  results,
}: {
  query: string;
  results: GlobalSearchResults;
}) {
  const total =
    results.audits.length +
    results.clients.length +
    results.documents.length +
    results.locations.length +
    results.personnel.length;

  if (query.trim().length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <p className="text-base font-medium text-zinc-900">Ricerca globale</p>
        <p className="mt-2 text-sm text-zinc-500">
          Inserisci almeno 2 caratteri per cercare audit, clienti, sedi, collaboratori e documenti.
        </p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center">
        <p className="text-base font-medium text-zinc-900">Nessun risultato per “{query}”</p>
        <p className="mt-2 text-sm text-zinc-500">
          Prova con un titolo audit, un nome cliente o il cognome di un collaboratore.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
        <p className="text-sm font-semibold text-zinc-900">{total} risultati trovati</p>
        <p className="mt-1 text-xs text-zinc-500">
          La ricerca usa il perimetro organizzativo attivo e privilegia i risultati piu recenti.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Audit" icon={<ClipboardCheck className="h-4 w-4" />} items={results.audits} />
        <Section title="Clienti" icon={<Building2 className="h-4 w-4" />} items={results.clients} />
        <Section title="Sedi" icon={<MapPin className="h-4 w-4" />} items={results.locations} />
        <Section title="Collaboratori" icon={<Users className="h-4 w-4" />} items={results.personnel} />
        <Section title="Documenti" icon={<FileText className="h-4 w-4" />} items={results.documents} />
      </div>
    </div>
  );
}
