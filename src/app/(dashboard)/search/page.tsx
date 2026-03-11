import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchResults } from "@/features/search/components/search-results";
import { getGlobalSearchResults } from "@/features/search/queries/get-global-search-results";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : "";
  const results = await getGlobalSearchResults(query);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Ricerca globale</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Un punto unico per trovare audit, clienti, sedi, collaboratori e documenti.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <form action="/search" className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Cerca per titolo audit, cliente, collaboratore, documento..."
            className="h-11 rounded-full border-zinc-200 bg-zinc-50 pl-10 pr-4"
          />
        </form>
      </section>

      <SearchResults query={query} results={results} />
    </div>
  );
}
