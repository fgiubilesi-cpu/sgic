"use client";

import { useState } from "react";
import { X, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EvidenceItem } from "@/features/audits/queries/get-audit-evidence";

type EvidenceGalleryProps = {
  evidence: EvidenceItem[];
  auditTitle?: string;
};

type SelectedEvidence = EvidenceItem | null;

export function EvidenceGallery({ evidence, auditTitle = "Audit Evidence" }: EvidenceGalleryProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<SelectedEvidence>(null);

  if (!evidence || evidence.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
        <div className="flex flex-col items-center gap-2">
          <svg
            className="w-12 h-12 text-zinc-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-medium text-zinc-600">No evidence photos uploaded</p>
          <p className="text-xs text-zinc-500">
            Photos will appear here as you add evidence to checklist items
          </p>
        </div>
      </div>
    );
  }

  // Group evidence by outcome for organization
  const groupedEvidence = evidence.reduce(
    (acc, item) => {
      const outcome = item.outcome || "pending";
      if (!acc[outcome]) {
        acc[outcome] = [];
      }
      acc[outcome].push(item);
      return acc;
    },
    {} as Record<string, EvidenceItem[]>
  );

  const outcomeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    compliant: {
      label: "Compliant",
      color: "border-green-200 bg-green-50",
      bgColor: "bg-green-100",
    },
    non_compliant: {
      label: "Non-Compliant",
      color: "border-red-200 bg-red-50",
      bgColor: "bg-red-100",
    },
    not_applicable: {
      label: "Not Applicable",
      color: "border-gray-200 bg-gray-50",
      bgColor: "bg-gray-100",
    },
    pending: {
      label: "Pending",
      color: "border-amber-200 bg-amber-50",
      bgColor: "bg-amber-100",
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900">Evidence Gallery</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {evidence.length} photo{evidence.length !== 1 ? "s" : ""} attached to this {auditTitle.toLowerCase()}
        </p>
      </div>

      {/* Evidence grouped by outcome */}
      {Object.entries(groupedEvidence).map(([outcome, items]) => {
        const config = outcomeConfig[outcome] || outcomeConfig.pending;

        return (
          <div key={outcome} className="space-y-3">
            <div className={cn("rounded-md border px-3 py-2", config.color)}>
              <h3 className="text-sm font-medium text-zinc-900">
                {config.label}
                <span className="ml-2 text-xs text-zinc-600">({items.length})</span>
              </h3>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedEvidence(item)}
                >
                  <img
                    src={item.evidenceUrl}
                    alt={item.question}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 bg-white/90 hover:bg-white text-zinc-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.evidenceUrl, "_blank");
                        }}
                        aria-label="Open in new tab"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Question label at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-xs text-white line-clamp-2 group-hover:line-clamp-none">
                      {item.question}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Full-screen lightbox for selected evidence */}
      {selectedEvidence && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedEvidence(null)}
        >
          <div
            className="max-w-3xl w-full bg-white rounded-lg shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-zinc-50 border-b border-zinc-200 px-4 py-3">
              <div className="flex-1">
                <h3 className="font-medium text-zinc-900">{selectedEvidence.question}</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Outcome: <span className="font-medium">{selectedEvidence.outcome.replace(/_/g, " ")}</span>
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelectedEvidence(null)}
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Image */}
            <div className="flex items-center justify-center bg-black min-h-96">
              <img
                src={selectedEvidence.evidenceUrl}
                alt={selectedEvidence.question}
                className="max-h-[70vh] max-w-full object-contain"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between bg-zinc-50 border-t border-zinc-200 px-4 py-3">
              <div className="text-xs text-zinc-600">
                {selectedEvidence.uploadedAt &&
                  new Date(selectedEvidence.uploadedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = selectedEvidence.evidenceUrl;
                  link.download = `evidence-${selectedEvidence.id}.jpg`;
                  link.click();
                }}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
