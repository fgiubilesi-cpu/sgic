"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink, Sparkles } from "lucide-react";
import {
  getKnowledgeReferencesForChecklistItem,
} from "@/features/knowledge/actions/knowledge-actions";
import type { KnowledgeSearchResult } from "@/features/knowledge/lib/knowledge-search";

interface SuggestedDocumentsRowProps {
  question: string;
  clientId?: string | null;
  locationId?: string | null;
  colSpan?: number;
  variant?: "info" | "violation";
}

const CATEGORY_LABELS: Record<string, string> = {
  Procedure: "Procedura",
  Manual: "Manuale",
  Instruction: "Istruzione",
  Form: "Modulo",
  Contract: "Contratto",
  Certificate: "Certificato",
  Report: "Report",
  OrgChart: "Organigramma",
  Authorization: "Autorizzazione",
  Registry: "Registro",
  Other: "Altro",
};

export function SuggestedDocumentsRow({
  question,
  clientId,
  locationId,
  colSpan = 7,
  variant = "info",
}: SuggestedDocumentsRowProps) {
  const [docs, setDocs] = useState<KnowledgeSearchResult[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getKnowledgeReferencesForChecklistItem({ question, clientId, locationId }).then((results) => {
      if (!cancelled) {
        setDocs(results);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [question, clientId, locationId]);

  if (!loaded || docs.length === 0) return null;

  return (
    <tr
      className={
        variant === "violation"
          ? "border-b border-amber-100 bg-amber-50/70"
          : "border-b border-blue-100 bg-blue-50/40"
      }
    >
      <td colSpan={colSpan} className="px-4 py-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1 text-xs font-medium shrink-0 ${
                variant === "violation" ? "text-amber-800" : "text-blue-700"
              }`}
            >
              {variant === "violation" ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : (
                <BookOpen className="w-3.5 h-3.5" />
              )}
              {variant === "violation"
                ? "Possibili procedure o riferimenti coinvolti:"
                : "Procedure di riferimento:"}
            </span>
          </div>

          <div className="grid gap-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <Link
                key={doc.id}
                href={doc.href}
                onClick={(e) => e.stopPropagation()}
                className={`rounded-xl border bg-white p-3 transition-colors hover:bg-zinc-50 ${
                  variant === "violation"
                    ? "border-amber-200 hover:border-amber-300"
                    : "border-blue-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                      {doc.category ? CATEGORY_LABELS[doc.category] ?? doc.category : "Documento"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-zinc-900 line-clamp-2">
                      {doc.title}
                    </p>
                  </div>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                </div>
                {doc.sectionLabel ? (
                  <p className="mt-2 text-[11px] font-medium text-zinc-500">{doc.sectionLabel}</p>
                ) : null}
                {doc.snippet ? (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 line-clamp-3">
                    {doc.snippet}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}
