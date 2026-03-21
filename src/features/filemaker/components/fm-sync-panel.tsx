"use client";

import { useState, useTransition } from "react";
import {
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncFromFileMakerAction, type SyncResult } from "@/features/filemaker/actions/sync-from-filemaker";

interface FMSyncPanelProps {
  fmConfigured: boolean;
}

export function FMSyncPanel({ fmConfigured }: FMSyncPanelProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  function handleSync() {
    startTransition(async () => {
      const res = await syncFromFileMakerAction();
      setResult(res);
      setShowDetails(!res.success); // apri dettagli se ci sono errori
    });
  }

  return (
    <div className="space-y-6">
      {/* Status FM */}
      <div
        className={`rounded-xl border p-4 flex items-center gap-3 ${
          fmConfigured
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <Database
          className={`h-5 w-5 flex-shrink-0 ${fmConfigured ? "text-green-600" : "text-amber-600"}`}
        />
        <div>
          <p
            className={`text-sm font-semibold ${fmConfigured ? "text-green-900" : "text-amber-900"}`}
          >
            {fmConfigured
              ? "FileMaker Data API configurata"
              : "FileMaker Data API non configurata"}
          </p>
          <p
            className={`text-xs mt-0.5 ${fmConfigured ? "text-green-700" : "text-amber-700"}`}
          >
            {fmConfigured
              ? "Pronta per la sincronizzazione. Verifica che FM sia raggiungibile."
              : "Configura FM_HOST, FM_DATABASE, FM_USERNAME, FM_PASSWORD in .env.local"}
          </p>
        </div>
      </div>

      {/* Descrizione import */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900">Cosa viene importato</h3>
        <ul className="space-y-1.5 text-sm text-zinc-600">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
            <span><strong>Clienti</strong> — dal layout <code className="text-xs bg-zinc-100 px-1 rounded">Clienti</code>: nome, indirizzo, P.IVA, email, telefono</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
            <span><strong>Sedi</strong> — dal layout <code className="text-xs bg-zinc-100 px-1 rounded">UnitaOperative</code>: nome sede, indirizzo, collegamento cliente</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
            <span><strong>Collaboratori</strong> — dal layout <code className="text-xs bg-zinc-100 px-1 rounded">Persone</code>: nome, cognome, email, mansione</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
            <span><strong>Visite mediche</strong> — dal layout <code className="text-xs bg-zinc-100 px-1 rounded">VisiteMediche</code> (se presente)</span>
          </li>
        </ul>
        <p className="text-xs text-zinc-400">
          I record esistenti vengono aggiornati (match su <code>fm_record_id</code> o P.IVA).
          Nessun record viene cancellato.
        </p>
      </div>

      {/* Bottone sync */}
      <Button
        onClick={handleSync}
        disabled={isPending || !fmConfigured}
        className="w-full gap-2"
        size="lg"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <RefreshCw className="h-5 w-5" />
        )}
        {isPending ? "Sincronizzazione in corso..." : "Importa da FileMaker"}
      </Button>

      {/* Risultato */}
      {result && (
        <div
          className={`rounded-xl border p-4 ${
            result.success
              ? "border-green-200 bg-green-50"
              : result.fmConfigured
                ? "border-amber-200 bg-amber-50"
                : "border-red-200 bg-red-50"
          }`}
        >
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : result.fmConfigured ? (
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-sm font-semibold ${
                  result.success
                    ? "text-green-900"
                    : result.fmConfigured
                      ? "text-amber-900"
                      : "text-red-900"
                }`}
              >
                {result.summary}
              </p>

              {result.fmConfigured && (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="mt-2 flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
                >
                  {showDetails ? (
                    <ChevronUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  {showDetails ? "Nascondi dettagli" : "Mostra dettagli"}
                </button>
              )}
            </div>
          </div>

          {showDetails && result.fmConfigured && (
            <div className="mt-4 space-y-3">
              {(
                [
                  ["Clienti + Sedi", result.details.clients],
                  ["Collaboratori + Visite", result.details.personnel],
                ] as const
              ).map(([label, detail]) => (
                <div key={label} className="rounded-lg bg-white border border-zinc-200 p-3">
                  <p className="text-xs font-semibold text-zinc-700 mb-2">{label}</p>
                  <div className="flex gap-4 text-xs text-zinc-600">
                    <span className="text-green-700 font-medium">+{detail.imported} nuovi</span>
                    <span className="text-blue-700 font-medium">↻ {detail.updated} aggiornati</span>
                    <span className="text-zinc-400">{detail.skipped} saltati</span>
                  </div>
                  {detail.errors.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {detail.errors.map((e, i) => (
                        <li key={i} className="text-xs text-red-600">
                          • {e}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
