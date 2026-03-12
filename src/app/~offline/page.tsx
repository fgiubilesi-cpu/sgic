'use client';

import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { CloudOff, Download } from 'lucide-react';
import { listOfflineAuditRecords } from '@/lib/offline/audit-cache';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function OfflineFallbackPage() {
  const offlineAudits = useLiveQuery(() => listOfflineAuditRecords(), []) ?? [];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700">
            <CloudOff className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Sei offline</h1>
            <p className="text-sm text-zinc-600">
              SGIC non riesce a contattare il server. Qui sotto trovi gli audit che hai
              preparato in anticipo per lavorare offline.
            </p>
          </div>
        </div>

        {offlineAudits.length > 0 ? (
          <div className="space-y-3">
            {offlineAudits.map((record) => (
              <div
                key={record.auditId}
                className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-sm font-semibold text-zinc-900">
                      {record.audit.title || 'Audit senza titolo'}
                    </h2>
                    <Badge variant="outline" className="border-sky-200 bg-sky-50 text-sky-700">
                      salvato offline
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-600">
                    {record.audit.client_name ? `${record.audit.client_name} · ` : ''}
                    {record.audit.location_name ?? 'Sede non specificata'}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Ultimo salvataggio: {new Date(record.savedAt).toLocaleString('it-IT')}
                  </p>
                </div>
                <Button asChild variant="outline" className="gap-2">
                  <Link href={record.path}>
                    <Download className="h-4 w-4" />
                    Apri audit offline
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
            Non hai ancora checklist salvate offline su questo dispositivo. Apri un audit quando sei
            connesso e usa il pulsante <strong>Salva offline</strong> prima di andare in campo.
          </div>
        )}
      </div>
    </main>
  );
}
