import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getErrorSummary(error: unknown) {
  if (!error) return "Errore sconosciuto.";

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object") {
    const candidate = error as {
      code?: string | null;
      details?: string | null;
      hint?: string | null;
      message?: string | null;
    };

    const parts = [
      candidate.message,
      candidate.code ? `code ${candidate.code}` : null,
      candidate.details,
      candidate.hint,
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(" · ");
    }
  }

  return "La vista management non e disponibile in questo momento.";
}

export function ManagementLoadError({ error }: { error: unknown }) {
  const summary = getErrorSummary(error);

  return (
    <Card className="border-amber-200 bg-amber-50/60">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base text-amber-950">
              Dashboard direzionale non disponibile
            </CardTitle>
            <CardDescription className="text-sm text-amber-900">
              La route esiste, ma il perimetro dati o lo schema di questo ambiente non e ancora
              completamente allineato.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-white/80 px-4 py-3 text-sm text-zinc-700">
          {summary}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Torna alla dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/clients">Apri clienti</Link>
          </Button>
          <Button asChild>
            <Link href="/organization">Verifica organization</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
