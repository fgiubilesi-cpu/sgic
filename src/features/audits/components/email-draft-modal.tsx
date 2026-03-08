"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Copy, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateEmailDraft } from "@/features/audits/actions/email-draft-actions";

interface EmailDraftModalProps {
  auditId: string;
  hasNonConformities: boolean;
}

export function EmailDraftModal({ auditId, hasNonConformities }: EmailDraftModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draftText, setDraftText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setDraftText(null);
    try {
      const result = await generateEmailDraft(auditId);
      if (result.success) {
        setDraftText(result.text);
        setIsOpen(true);
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!draftText) return;
    try {
      await navigator.clipboard.writeText(draftText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossibile copiare il testo.");
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={isLoading || !hasNonConformities}
        title={
          !hasNonConformities
            ? "Disponibile solo se l'audit ha almeno una NC"
            : "Genera bozza mail post-audit"
        }
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Mail className="w-4 h-4 text-blue-600" />
        )}
        {isLoading ? "Generazione…" : "Bozza mail"}
      </Button>

      {/* Modal overlay */}
      {isOpen && draftText && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className="relative z-10 w-full max-w-2xl rounded-xl border border-zinc-200 bg-white shadow-2xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-semibold text-zinc-900">Bozza mail post-audit</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copiato!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copia testo
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className="h-7 w-7"
                  aria-label="Chiudi"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4">
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                className="w-full h-full min-h-[400px] resize-none rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                spellCheck={false}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-100 bg-zinc-50 rounded-b-xl">
              <p className="text-xs text-zinc-400">
                Testo editabile — revisiona prima di inviare.
              </p>
              <Button size="sm" onClick={handleClose} variant="outline">
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
