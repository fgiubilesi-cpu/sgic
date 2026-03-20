import { redirect } from "next/navigation";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import Link from "next/link";
import { getOrganizationContext } from "@/lib/supabase/get-org-context";
import { getSamplings } from "@/features/samplings/queries/get-samplings";
import { CreateSamplingSheet } from "@/features/samplings/components/create-sampling-sheet";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FlaskConical } from "lucide-react";

export const dynamic = "force-dynamic";

function statusBadge(status: string | null) {
  if (status === "completed")
    return { label: "Completato", tone: "border-emerald-200 bg-emerald-50 text-emerald-700" };
  if (status === "cancelled")
    return { label: "Annullato", tone: "border-zinc-200 bg-zinc-50 text-zinc-500" };
  return { label: "Pianificato", tone: "border-sky-200 bg-sky-50 text-sky-700" };
}

export default async function SamplingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getOrganizationContext();
  if (!ctx) redirect("/login");

  const params = await searchParams;
  const clientFilter = typeof params.client === "string" ? params.client : undefined;

  const samplings = await getSamplings(ctx.organizationId, clientFilter);

  const completedCount = samplings.filter((s) => s.status === "completed").length;
  const plannedCount = samplings.filter((s) => s.status === "planned").length;
  const totalLabResults = samplings.reduce((sum, s) => sum + s.lab_result_count, 0);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Campionamenti
          </h1>
          <p className="max-w-2xl text-sm text-zinc-500">
            Campionamenti acqua, superfici, alimenti e risultati laboratorio.
          </p>
        </div>
        <CreateSamplingSheet />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold">{samplings.length}</div>
          <div className="text-xs text-zinc-500">Campionamenti totali</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold text-emerald-600">{completedCount}</div>
          <div className="text-xs text-zinc-500">Completati</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold text-sky-600">{plannedCount}</div>
          <div className="text-xs text-zinc-500">Pianificati</div>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3">
          <div className="text-2xl font-semibold">{totalLabResults}</div>
          <div className="text-xs text-zinc-500">Risultati lab</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white">
        {samplings.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <FlaskConical className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-2 text-sm font-medium text-zinc-700">Nessun campionamento trovato</p>
            <p className="mt-1 text-xs text-zinc-500">
              Crea il primo campionamento dal pulsante sopra.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titolo</TableHead>
                <TableHead>Matrice</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Risultati</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {samplings.map((s) => {
                const badge = statusBadge(s.status);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.title ?? "-"}</TableCell>
                    <TableCell>{s.matrix ?? "-"}</TableCell>
                    <TableCell>
                      {s.sampling_date
                        ? format(new Date(s.sampling_date), "dd MMM yyyy", { locale: it })
                        : "-"}
                    </TableCell>
                    <TableCell>{s.client_name ?? "-"}</TableCell>
                    <TableCell>{s.location_name ?? "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badge.tone}>
                        {badge.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.lab_result_count > 0 ? (
                        <span className="text-sm font-medium">{s.lab_result_count}</span>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/samplings/${s.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Dettagli
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}
