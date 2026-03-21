"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { FileText, Link2, Unlink, Search, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getNCDocuments,
  linkDocumentToNC,
  unlinkDocumentFromNC,
  searchDocumentsForNC,
  type NCDocumentLink,
  type DocumentSearchResult,
} from "@/features/audits/actions/nc-document-actions";

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
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    loadLinks();
  }, [loadLinks]);

  useEffect(() => {
    if (!dialogOpen) return;
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
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
      await loadLinks();
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
      await loadLinks();
    } else {
      toast.error(result.error ?? "Errore nella rimozione.");
    }
  }

  const linkedDocIds = new Set(links.map((l) => l.document_id));

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-zinc-700 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-zinc-400" />
          Documenti collegati
          {links.length > 0 && (
            <Badge className="text-xs bg-zinc-100 text-zinc-600 border-0 ml-1">{links.length}</Badge>
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
                  <span className="text-xs text-zinc-800 truncate">{doc.title ?? "Documento"}</span>
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

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) { setSearchQuery(""); setSearchResults([]); }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">Collega documento alla NC</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca documento per titolo..."
              className="pl-9"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="min-h-[120px] max-h-60 overflow-y-auto space-y-1">
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
                    className="flex items-center justify-between gap-3 rounded border border-zinc-100 bg-zinc-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">
                        {doc.title ?? "Documento"}
                      </p>
                      {doc.category && (
                        <p className="text-xs text-zinc-500">
                          {CATEGORY_LABELS[doc.category] ?? doc.category}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant={alreadyLinked ? "outline" : "default"}
                      size="sm"
                      disabled={alreadyLinked || linking === doc.id}
                      onClick={() => handleLink(doc.id)}
                      className="shrink-0 h-7 text-xs"
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
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
