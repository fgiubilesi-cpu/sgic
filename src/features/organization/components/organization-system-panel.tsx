import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrganizationSystemSnapshot } from "@/features/organization/queries/get-organization-system-snapshot";

export function OrganizationSystemPanel({
  snapshot,
}: {
  snapshot: OrganizationSystemSnapshot;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tenant system snapshot</CardTitle>
          <CardDescription>
            Stato tecnico leggibile dell&apos;istanza senza dover uscire da SGIC.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Versione app</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{snapshot.version}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Ambiente</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{snapshot.environment}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Migrazioni locali</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">{snapshot.localMigrationsCount}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">Supabase config</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {snapshot.supabaseConfigured ? "Presente" : "Assente"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Release discipline</CardTitle>
          <CardDescription>
            Promemoria operativo per mantenere il tenant rilasciabile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-zinc-600">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="font-medium text-zinc-900">Ultima migration locale</p>
            <p className="mt-1 break-all text-xs text-zinc-500">{snapshot.latestLocalMigration || "Nessuna migration locale trovata"}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="font-medium text-zinc-900">Comando di verifica</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{snapshot.releaseCommand}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="rounded-full border border-zinc-200 bg-white text-zinc-700">Build before merge</Badge>
            <Badge className="rounded-full border border-zinc-200 bg-white text-zinc-700">Migration before feature DB</Badge>
            <Badge className="rounded-full border border-zinc-200 bg-white text-zinc-700">Main stays stable</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
