import { AlertTriangle, Link2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ClientOperationalHygieneCardProps {
  hasTrackedServiceLines: boolean;
  onOpenActivities?: () => void;
  onOpenContract?: () => void;
  onOpenDeadlines?: () => void;
  unlinkedOpenManualDeadlinesCount: number;
  unlinkedOpenTasksCount: number;
}

export function ClientOperationalHygieneCard({
  hasTrackedServiceLines,
  onOpenActivities,
  onOpenContract,
  onOpenDeadlines,
  unlinkedOpenManualDeadlinesCount,
  unlinkedOpenTasksCount,
}: ClientOperationalHygieneCardProps) {
  const totalGaps = unlinkedOpenTasksCount + unlinkedOpenManualDeadlinesCount;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Integrita operativa</CardTitle>
          <CardDescription>
            Quanto il lavoro interno e gia collegato alle linee servizio che dovrebbero presidiare.
          </CardDescription>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-right">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Gap aperti</p>
          <p className="text-2xl font-semibold text-zinc-900">{totalGaps}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasTrackedServiceLines ? (
          <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
            Nessuna linea servizio attiva disponibile. Importa prima il perimetro contrattuale, poi
            qui controllerai i collegamenti mancanti tra attivita, scadenze e servizi.
          </div>
        ) : totalGaps === 0 ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
            Tutte le task aperte e le scadenze manuali risultano gia collegate a una linea servizio.
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Task senza linea</p>
                <p className="mt-2 text-2xl font-semibold text-amber-700">
                  {unlinkedOpenTasksCount}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">
                  Scadenze senza linea
                </p>
                <p className="mt-2 text-2xl font-semibold text-amber-700">
                  {unlinkedOpenManualDeadlinesCount}
                </p>
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Totale da completare</p>
                <p className="mt-2 text-2xl font-semibold text-rose-700">{totalGaps}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-800">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Perche conta
              </div>
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
                Finche task e scadenze restano scollegate dalle linee servizio, la copertura rimane
                parzialmente euristica e meno affidabile per team operativo e direzione.
              </div>
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-2">
          {onOpenActivities ? (
            <Button variant="outline" size="sm" onClick={onOpenActivities}>
              <Link2 className="mr-2 h-3.5 w-3.5" />
              Apri attivita
            </Button>
          ) : null}
          {onOpenDeadlines ? (
            <Button variant="outline" size="sm" onClick={onOpenDeadlines}>
              <Link2 className="mr-2 h-3.5 w-3.5" />
              Apri scadenze
            </Button>
          ) : null}
          {onOpenContract ? (
            <Button variant="outline" size="sm" onClick={onOpenContract}>
              <ShieldCheck className="mr-2 h-3.5 w-3.5" />
              Apri contratto
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
