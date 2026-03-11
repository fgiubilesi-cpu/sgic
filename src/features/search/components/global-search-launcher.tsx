import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function GlobalSearchLauncher() {
  return (
    <form action="/search" className="hidden w-full max-w-md items-center gap-2 md:flex">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          type="search"
          name="q"
          placeholder="Cerca audit, clienti, collaboratori, documenti..."
          className="h-10 rounded-full border-zinc-200 bg-zinc-50 pl-9 pr-16 text-sm shadow-none"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-400">
          /search
        </span>
      </div>
    </form>
  );
}
