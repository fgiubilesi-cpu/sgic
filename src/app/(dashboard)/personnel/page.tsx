import { redirect } from "next/navigation";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { getPersonnelList } from "@/features/personnel/queries/get-personnel";
import { getClientOptions } from "@/features/clients/queries/get-client-options";
import { PersonnelTable } from "@/features/personnel/components/personnel-table";
import { ManagePersonnelSheet } from "@/features/personnel/components/manage-personnel-sheet";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PersonnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getOrganizationContext();
  if (!ctx) redirect("/login");

  const params = await searchParams;
  const clientFilter = typeof params.client === "string" ? params.client : undefined;

  const [personnel, clientOptions] = await Promise.all([
    getPersonnelList(ctx.organizationId, clientFilter),
    getClientOptions(ctx.organizationId),
  ]);

  const activeCount = personnel.filter((p) => p.is_active).length;
  const expiredTraining = personnel.reduce((sum, p) => sum + p.training_expired_count, 0);
  const expiringTraining = personnel.reduce((sum, p) => sum + p.training_expiring_count, 0);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Personale
          </h1>
          <p className="max-w-2xl text-sm text-zinc-500">
            Dipendenti dei clienti: anagrafica, formazione, visite mediche e stato operativo.
          </p>
        </div>
        <ManagePersonnelSheet
          clientOptions={clientOptions}
        />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold">{personnel.length}</div>
          <div className="text-xs text-zinc-500">Totale collaboratori</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold text-emerald-600">{activeCount}</div>
          <div className="text-xs text-zinc-500">Attivi</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold text-rose-600">{expiredTraining}</div>
          <div className="text-xs text-zinc-500">Formazione scaduta</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold text-amber-600">{expiringTraining}</div>
          <div className="text-xs text-zinc-500">In scadenza (30gg)</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white">
        {personnel.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Users className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-2 text-sm font-medium text-zinc-700">Nessun collaboratore trovato</p>
            <p className="mt-1 text-xs text-zinc-500">
              {clientFilter
                ? "Nessun collaboratore per il cliente selezionato."
                : "Aggiungi il primo collaboratore dal pulsante sopra."}
            </p>
          </div>
        ) : (
          <PersonnelTable clientOptions={clientOptions} personnel={personnel} />
        )}
      </div>
    </section>
  );
}
