import Link from "next/link";
import { ArrowRight, BookOpenText, Scale, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RegulatoryBridgeModel } from "@/features/regulatory/lib/regulatory-bridge";

const statusClasses: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-zinc-200 bg-zinc-50 text-zinc-700",
  none: "border-zinc-200 bg-zinc-50 text-zinc-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ready: "border-blue-200 bg-blue-50 text-blue-700",
  upcoming: "border-amber-200 bg-amber-50 text-amber-700",
};

const moduleLabels: Record<string, string> = {
  audits: "Audit",
  clients: "Clienti",
  deadlines: "Scadenze",
  documents: "Documenti",
  quality: "Qualita",
  training: "Training",
};

function formatDate(value: string | null) {
  if (!value) return "Tema continuo";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function RegulatoryBridgeShell({
  bridge,
}: {
  bridge: RegulatoryBridgeModel;
}) {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-zinc-500" />
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Regulatory Bridge
          </h1>
        </div>
        <p className="mt-2 text-sm text-zinc-500">
          Collega snapshot ecosistema, contenuti e clienti impattati con logica esplicita e navigabile.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Versione snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{bridge.snapshotMeta.version}</div>
            <p className="mt-1 text-sm text-zinc-500">
              Generato {formatDate(bridge.snapshotMeta.generatedAt)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Obblighi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{bridge.snapshotMeta.totalDeadlines}</div>
            <p className="mt-1 text-sm text-zinc-500">Scadenze normative mappate</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Temi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{bridge.snapshotMeta.totalThemes}</div>
            <p className="mt-1 text-sm text-zinc-500">Asset editoriali e temi collegati</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">Asset pubblicati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{bridge.snapshotMeta.publishedAssets}</div>
            <p className="mt-1 text-sm text-zinc-500">Contenuti pronti da riusare in prodotto</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {bridge.items.map((item) => (
          <Card key={item.id} className="border-zinc-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base font-semibold text-zinc-900">
                      {item.id} · {item.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={statusClasses[item.status] ?? statusClasses.none}
                    >
                      {item.status}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={statusClasses[item.assetStatus] ?? statusClasses.none}
                    >
                      asset {item.assetStatus}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1">
                    {item.kind === "deadline"
                      ? `${item.jurisdiction ?? "Perimetro non definito"} · ${formatDate(item.effectiveDate)}`
                      : `Tema editoriale con ${item.assetCount} asset collegati`}
                  </CardDescription>
                </div>
                <Link
                  href={item.primaryHref}
                  className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
                >
                  Apri modulo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-wrap gap-2">
                {item.modules.map((module) => (
                  <Badge key={module} variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-700">
                    {moduleLabels[module] ?? module}
                  </Badge>
                ))}
                {item.contentStreams.map((stream) => (
                  <Badge key={stream} variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                    {stream}
                  </Badge>
                ))}
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-zinc-400" />
                      <p className="text-sm font-semibold text-zinc-700">Clienti impattati</p>
                    </div>
                    {item.impactedClients.length === 0 ? (
                      <p className="mt-2 text-sm text-zinc-500">
                        Nessun match esplicito trovato nei contratti, nelle service line o nelle scadenze cliente.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-3">
                        {item.impactedClients.map((client) => (
                          <div
                            key={client.clientId}
                            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-medium text-zinc-900">{client.clientName}</p>
                              <Badge variant="outline" className="border-zinc-200 bg-white text-zinc-700">
                                score {client.score}
                              </Badge>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {client.reasons.map((reason) => (
                                <Badge key={reason} variant="outline" className="border-zinc-200 bg-white text-zinc-600">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpenText className="h-4 w-4 text-zinc-400" />
                      <p className="text-sm font-semibold text-zinc-700">Azioni consigliate</p>
                    </div>
                    <div className="mt-3 space-y-2">
                      {item.recommendedActions.length === 0 ? (
                        <p className="text-sm text-zinc-500">Nessuna azione esplicita configurata.</p>
                      ) : (
                        item.recommendedActions.map((action) => (
                          <div
                            key={action}
                            className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700"
                          >
                            {action}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-zinc-700">Parole chiave ponte</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.matchKeywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="border-zinc-200 bg-white text-zinc-600">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-zinc-700">Source refs</p>
                    <div className="mt-3 space-y-2 text-xs text-zinc-500">
                      {item.sourceRefs.map((source) => (
                        <div key={`${source.repo}:${source.path}`} className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                          {source.repo} · {source.path}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
