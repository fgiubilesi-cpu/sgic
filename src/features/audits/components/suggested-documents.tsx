"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";
import { suggestDocumentsForQuestion, type SuggestedDocument } from "@/features/documents/queries/suggest-documents";

interface SuggestedDocumentsRowProps {
  question: string;
  clientId?: string | null;
  colSpan?: number;
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
  colSpan = 7,
}: SuggestedDocumentsRowProps) {
  const [docs, setDocs] = useState<SuggestedDocument[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    suggestDocumentsForQuestion(question, clientId).then((results) => {
      if (!cancelled) {
        setDocs(results);
        setLoaded(true);
      }
    });
    return () => { cancelled = true; };
  }, [question, clientId]);

  if (!loaded || docs.length === 0) return null;

  return (
    <tr className="border-b border-zinc-100 bg-blue-50/40">
      <td colSpan={colSpan} className="px-4 py-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-medium text-blue-700 shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
            Procedure suggerite:
          </span>
          {docs.map((doc) => (
            <Link
              key={doc.id}
              href={doc.client_id ? `/clients/${doc.client_id}` : "/documents"}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-white px-2.5 py-0.5 text-xs text-blue-700 hover:bg-blue-50 transition-colors"
            >
              {doc.category && (
                <span className="text-blue-400">{CATEGORY_LABELS[doc.category] ?? doc.category}</span>
              )}
              {doc.category && <span className="text-blue-300">·</span>}
              <span className="truncate max-w-[180px]">{doc.title ?? "Documento"}</span>
              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            </Link>
          ))}
        </div>
      </td>
    </tr>
  );
}
