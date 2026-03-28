import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DocumentIntakeReviewSheet } from "@/features/documents/components/document-intake-review-sheet";
import type { DocumentActionSuggestion } from "@/features/documents/lib/document-action-suggestions";
import type { DocumentListItem } from "@/features/documents/queries/get-documents";

function toneClasses(tone: DocumentActionSuggestion["tone"]) {
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-sky-200 bg-sky-50 text-sky-700";
}

function statusLabel(status: DocumentActionSuggestion["status"]) {
  if (status === "needs_context") return "Serve contesto";
  return "Pronta per review";
}

export function DocumentActionSuggestionsCard({
  document,
  linkedEntityCount,
  suggestions,
}: {
  document: DocumentListItem;
  linkedEntityCount: number;
  suggestions: DocumentActionSuggestion[];
}) {
  const hasSuggestions = suggestions.length > 0;

  return (
    <Card className="border-zinc-200">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-zinc-400" />
              <CardTitle className="text-lg text-zinc-900">
                Cosa posso fare adesso
              </CardTitle>
            </div>
            <CardDescription>
              Il documento mostra solo suggestion review-first: niente scritture automatiche silenziose.
            </CardDescription>
          </div>
          <DocumentIntakeReviewSheet document={document} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600">
            {linkedEntityCount > 0
              ? `${linkedEntityCount} entità già collegate`
              : "Nessuna entità ancora collegata"}
          </Badge>
          <Badge variant="outline" className="border-zinc-200 bg-zinc-50 text-zinc-600">
            {hasSuggestions ? `${suggestions.length} suggestion` : "Nessuna suggestion forte"}
          </Badge>
        </div>

        {!hasSuggestions ? (
          <p className="text-sm text-zinc-600">
            Nessuna suggestion strutturata abbastanza forte da mostrare in pagina. Usa la review
            intake per normalizzare il contenuto o applicarlo manualmente al workspace.
          </p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-zinc-900">{suggestion.title}</p>
                  <Badge variant="outline" className={toneClasses(suggestion.tone)}>
                    {statusLabel(suggestion.status)}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-zinc-600">{suggestion.description}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
