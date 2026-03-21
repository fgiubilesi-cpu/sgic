import { notFound } from "next/navigation";
import { Database } from "lucide-react";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { isFMConfigured } from "@/lib/filemaker/fm-client";
import { FMSyncPanel } from "@/features/filemaker/components/fm-sync-panel";

export const dynamic = "force-dynamic";

export default async function FMSyncPage() {
  const ctx = await getOrganizationContext();

  // Solo admin
  if (!ctx || ctx.role !== "admin") {
    notFound();
  }

  const fmConfigured = isFMConfigured();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-zinc-400" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Sincronizzazione FileMaker
          </h1>
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Importa e sincronizza anagrafiche da FileMaker verso SGIC.
          I dati esistenti vengono aggiornati, nessun dato viene eliminato.
        </p>
      </div>

      <FMSyncPanel fmConfigured={fmConfigured} />

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-xs font-semibold text-zinc-600 mb-2">Configurazione campi FM</p>
        <p className="text-xs text-zinc-500">
          I nomi dei layout e dei campi FileMaker sono configurabili in{" "}
          <code className="bg-white border border-zinc-200 rounded px-1 py-0.5">
            src/lib/filemaker/fm-client.ts
          </code>{" "}
          → costanti <code className="bg-white border border-zinc-200 rounded px-1 py-0.5">FM_LAYOUTS</code> e{" "}
          <code className="bg-white border border-zinc-200 rounded px-1 py-0.5">FM_FIELDS</code>.
        </p>
      </div>
    </div>
  );
}
