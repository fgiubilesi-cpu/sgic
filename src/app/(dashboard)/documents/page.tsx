import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { getDocuments } from "@/features/documents/queries/get-documents";
import { getClientOptions } from "@/features/clients/queries/get-client-options";
import { getPersonnelList } from "@/features/personnel/queries/get-personnel";
import { DocumentsTable } from "@/features/documents/components/documents-table";
import { ManageDocumentSheet } from "@/features/documents/components/manage-document-sheet";
import { FileText } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getOrganizationContext();
  if (!ctx) redirect("/login");

  const params = await searchParams;
  const clientFilter = typeof params.client === "string" ? params.client : undefined;

  const [documents, clientOptions, personnelOptions] = await Promise.all([
    getDocuments({
      organizationId: ctx.organizationId,
      clientIds: clientFilter ? [clientFilter] : undefined,
    }),
    getClientOptions(ctx.organizationId),
    getPersonnelList(ctx.organizationId),
  ]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Documenti
          </h1>
          <p className="max-w-2xl text-sm text-zinc-500">
            Manuali, procedure, istruzioni operative, certificati e contratti.
            {clientFilter && documents.length > 0
              ? ` Filtrati per cliente: ${documents[0]?.client_name ?? "selezionato"}.`
              : ""}
          </p>
        </div>
        <ManageDocumentSheet
          clientOptions={clientOptions}
          personnelOptions={personnelOptions}
          triggerLabel="Nuovo documento"
        />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold">{documents.length}</div>
          <div className="text-xs text-zinc-500">Documenti totali</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold">
            {documents.filter((d) => d.status === "published").length}
          </div>
          <div className="text-xs text-zinc-500">Pubblicati</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold text-amber-600">
            {documents.filter((d) => {
              if (!d.expiry_date) return false;
              const exp = new Date(d.expiry_date);
              const in30 = new Date();
              in30.setDate(in30.getDate() + 30);
              return exp <= in30 && exp >= new Date();
            }).length}
          </div>
          <div className="text-xs text-zinc-500">In scadenza (30gg)</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold text-rose-600">
            {documents.filter((d) => {
              if (!d.expiry_date) return false;
              return new Date(d.expiry_date) < new Date();
            }).length}
          </div>
          <div className="text-xs text-zinc-500">Scaduti</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white">
        <DocumentsTable
          clientOptions={clientOptions}
          documents={documents}
          personnelOptions={personnelOptions}
          emptyMessage="Nessun documento trovato per i filtri correnti."
          emptyAction={
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-8 w-8 text-zinc-300" />
              <p className="text-xs text-zinc-500">
                Carica il primo documento per questo cliente.
              </p>
            </div>
          }
        />
      </div>
    </section>
  );
}
