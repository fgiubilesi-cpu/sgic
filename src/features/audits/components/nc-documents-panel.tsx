"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  BookOpenText,
  ExternalLink,
  FileText,
  Link2,
  Loader2,
  Search,
  Unlink,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getNCDocuments,
  linkDocumentToNC,
  unlinkDocumentFromNC,
  searchDocumentsForNC,
  type NCDocumentLink,
  type DocumentSearchResult,
} from "@/features/audits/actions/nc-document-actions";
import { getKnowledgeReferencesForNC } from "@/features/knowledge/actions/knowledge-actions";
import type { KnowledgeSearchResult } from "@/features/knowledge/lib/knowledge-search";

interface NCDocumentsPanelProps {
  nonConformityId: string;
  readOnly?: boolean;
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

function extractDocumentData(link: NCDocumentLink) {
  const doc = Array.isArray(link.documents) ? link.documents[0] : link.documents;
  return doc ?? null;
}

export function NCDocumentsPanel({ nonConformityId, readOnly = false }: NCDocumentsPanelProps) {
  const [links, setLinks] = useState<NCDocumentLink[]>([]);
  const [references, setReferences] = useState<KnowledgeSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [referencesLoading, setReferencesLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);

  const loadLinks = useCallback(async () => {
    const data = await getNCDocuments(nonConformityId);
    setLinks(data);
    setLoading(false);
  }, [nonConformityId]);

  const loadReferences = useCallback(async () => {
    setReferencesLoading(true);
    const data = await getKnowledgeReferencesForNC(nonConformityId);
    setReferences(data);
    setReferencesLoading(false);
  }, [nonConformityId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadLinks();
      void loadReferences();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadLinks, loadReferences]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (searchQuery.length < 2) {
      const resetTimer = window.setTimeout(() => {
        setSearchResults([]);
        setSearching(false);
      }, 0);

      return () => window.clearTimeout(resetTimer);
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      const results = await searchDocumentsForNC(searchQuery);
      setSearchResults(results);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, dialogOpen]);

  async function handleLink(documentId: string) {
    setLinking(documentId);
    const result = await linkDocumentToNC(nonConformityId, documentId);
    setLinking(null);
    if (result.success) {
      toast.success("Documento collegato.");
      await Promise.all([loadLinks(), loadReferences()]);
      setDialogOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    } else {
      toast.error(result.error ?? "Errore nel collegamento.");
    }
  }

  async function handleUnlink(documentId: string) {
    if (!confirm("Rimuovere il collegamento con questo documento?")) return;
    setUnlinking(documentId);
    const result = await unlinkDocumentFromNC(nonConformityId, documentId);
    setUnlinking(null);
    if (result.success) {
      toast.success("Collegamento rimosso.");
      await Promise.all([loadLinks(), loadReferences()]);
    } else {
      toast.error(result.error ?? "Errore nella rimozione.");
    }
  }

  const linkedDocIds = new Set(links.map((link) => link.document_id));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-zinc-700 flex items-center gap-1.5">
            <BookOpenText className="w-3.5 h-3.5 text-zinc-400" />
            Riferimenti normativi
            {references.length > 0 && (
              <Badge className="text-xs bg-blue-100 text-blue-700 border-0 ml-1">
                {references.length}
              </Badge>
            )}
          </h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => loadReferences()}
            className="h-7 px-2 text-xs gap-1"
          >
            Aggiorna
          </Button>
        </div>

        {referencesLoading ? (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 py-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Analisi knowledge base...
          </div>
        ) : references.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">
            Nessun riferimento rilevante trovato nel corpus documentale.
          </p>
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {references.map((reference) => {
              const alreadyLinked = linkedDocIds.has(reference.id);
              return (
                <div
                  key={reference.id}
                  className="rounded-xl border border-blue-100 bg-blue-50/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                        {reference.category
                          ? CATEGORY_LABELS[reference.category] ?? reference.category
                          : "Documento"}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-zinc-900 line-clamp-2">
                        {reference.title}
                      </p>
                    </div>
                    <Link
                      href={reference.href}
                      className="rounded-md border border-blue-200 bg-white p-1.5 text-blue-700 transition-colors hover:bg-blue-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  {reference.sectionLabel ? (
                    <p className="mt-2 text-[11px] font-medium text-zinc-500">
                      {reference.sectionLabel}
                    </p>
                  ) : null}

                  {reference.snippet ? (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-600 line-clamp-3">
                      {reference.snippet}
                    </p>
                  ) : null}

                  {!readOnly && (
                    <div className="mt-3 flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={alreadyLinked ? "outline" : "default"}
                        disabled={alreadyLinked || linking === reference.id}
                        onClick={() => handleLink(reference.id)}
                        className="h-7 text-xs"
                      >
                        {linking === reference.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : alreadyLinked ? (
                          "Già collegato"
                        ) : (
                          "Collega"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-zinc-100 pt-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-zinc-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            Documenti collegati
            {links.length > 0 && (
              <Badge className="text-xs bg-zinc-100 text-zinc-600 border-0 ml-1">
                {links.length}
              </Badge>
            )}
          </h4>
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="h-7 px-2 text-xs gap-1"
            >
              <Link2 className="w-3 h-3" />
              Collega
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 py-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Caricamento...
          </div>
        ) : links.length === 0 ? (
          <p className="text-xs text-zinc-400 italic">Nessun documento collegato.</p>
        ) : (
          <ul className="space-y-1.5">
            {links.map((link) => {
              const doc = extractDocumentData(link);
              if (!doc) return null;
              return (
                <li
                  key={link.id}
                  className="flex items-center justify-between gap-2 rounded border border-zinc-100 bg-zinc-50 px-2 py-1.5"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <Link
                      href={`/documents/${doc.id}`}
                      className="text-xs text-zinc-800 truncate hover:text-zinc-950 hover:underline"
                    >
                      {doc.title ?? "Documento"}
                    </Link>
                    {doc.category && (
                      <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-100 shrink-0">
                        {CATEGORY_LABELS[doc.category] ?? doc.category}
                      </Badge>
                    )}
                  </div>
                  {!readOnly && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={unlinking === link.document_id}
                      onClick={() => handleUnlink(link.document_id)}
                      className="h-6 px-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                      title="Rimuovi collegamento"
                    >
                      {unlinking === link.document_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Unlink className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setSearchQuery("");
            setSearchResults([]);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-base">Collega documento alla NC</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca documento per titolo, descrizione o testo..."
              className="pl-9"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="min-h-[140px] max-h-80 overflow-y-auto space-y-2">
            {searching ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Ricerca...
              </div>
            ) : searchQuery.length < 2 ? (
              <p className="text-center text-sm text-zinc-400 py-8">
                Digita almeno 2 caratteri per cercare.
              </p>
            ) : searchResults.length === 0 ? (
              <p className="text-center text-sm text-zinc-400 py-8">Nessun risultato.</p>
            ) : (
              searchResults.map((doc) => {
                const alreadyLinked = linkedDocIds.has(doc.id);
                return (
                  <div
                    key={doc.id}
                    className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 truncate">
                          {doc.title}
                        </p>
                        {doc.category && (
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {CATEGORY_LABELS[doc.category] ?? doc.category}
                            {doc.sectionLabel ? ` · ${doc.sectionLabel}` : ""}
                          </p>
                        )}
                        {doc.snippet ? (
                          <p className="mt-1 text-xs leading-relaxed text-zinc-600 line-clamp-3">
                            {doc.snippet}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={doc.href}
                          className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                        <Button
                          type="button"
                          variant={alreadyLinked ? "outline" : "default"}
                          size="sm"
                          disabled={alreadyLinked || linking === doc.id}
                          onClick={() => handleLink(doc.id)}
                          className="h-7 text-xs"
                        >
                          {linking === doc.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : alreadyLinked ? (
                            "Già collegato"
                          ) : (
                            "Collega"
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
