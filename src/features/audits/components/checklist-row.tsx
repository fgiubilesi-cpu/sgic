"use client";

import { useState, useRef, useOptimistic, startTransition, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Check, X, Minus, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { updateChecklistItem } from "@/features/audits/actions";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { MediaCapture } from "./media-capture";
import { AudioRecorder } from "./audio-recorder";
import type { AuditOutcome } from "@/types/database.types";

interface ChecklistRowProps {
  id: string;
  itemNumber: number;
  question: string;
  initialOutcome: AuditOutcome;
  initialNotes: string | null;
  initialEvidenceUrl: string | null;
  initialAudioUrl: string | null;
  auditId: string;
  isSelected: boolean;
  hasNc?: boolean;
  onSelect: () => void;
  path: string;
}

type ChecklistRowState = {
  outcome: AuditOutcome;
  notes: string;
  evidenceUrl: string | null;
  audioUrl: string | null;
};

export function ChecklistRow({
  id,
  itemNumber,
  question,
  initialOutcome,
  initialNotes,
  initialEvidenceUrl,
  initialAudioUrl,
  auditId,
  isSelected,
  hasNc = false,
  onSelect,
  path,
}: ChecklistRowProps) {
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechRecognition();

  const [optimisticItem, setOptimisticItem] = useOptimistic<
    ChecklistRowState,
    Partial<ChecklistRowState>
  >(
    {
      outcome: initialOutcome,
      notes: initialNotes ?? "",
      evidenceUrl: initialEvidenceUrl,
      audioUrl: initialAudioUrl,
    },
    (state, newValues) => ({ ...state, ...newValues })
  );

  // Append transcript to notes
  const appendTranscript = useCallback(
    (text: string) => {
      const newNotes = optimisticItem.notes
        ? `${optimisticItem.notes} ${text}`
        : text;
      startTransition(() => {
        setOptimisticItem({ notes: newNotes });
      });
      const formData = new FormData();
      formData.append("itemId", id);
      formData.append("notes", newNotes);
      formData.append("path", path);
      updateChecklistItem(formData).then((result) => {
        if ("error" in result) toast.error("Failed to save note.");
      });
    },
    [id, path, optimisticItem.notes]
  );

  useEffect(() => {
    if (transcript) {
      appendTranscript(transcript);
    }
  }, [transcript, appendTranscript]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const handleOutcomeChange = async (newOutcome: AuditOutcome) => {
    startTransition(() => {
      setOptimisticItem({ outcome: newOutcome });
    });

    const formData = new FormData();
    formData.append("itemId", id);
    formData.append("outcome", newOutcome);
    formData.append("path", path);

    const result = await updateChecklistItem(formData);
    if ("error" in result) toast.error("Failed to save outcome.");
  };

  const handleNotesChange = (newNotes: string) => {
    startTransition(() => {
      setOptimisticItem({ notes: newNotes });
    });

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const formData = new FormData();
      formData.append("itemId", id);
      formData.append("notes", newNotes);
      formData.append("path", path);

      updateChecklistItem(formData).then((result) => {
        if ("error" in result) {
          toast.error("Failed to save note.");
        }
      });
    }, 500);
  };

  const isEvenRow = itemNumber % 2 === 0;
  const rowBgClass = isEvenRow ? "bg-white" : "bg-zinc-50";
  const selectionClass = isSelected ? "border-l-4 border-l-blue-600" : "border-l-4 border-l-transparent";

  return (
    <tr
      className={cn(
        "h-11 border-b border-zinc-200 hover:bg-zinc-100 transition-colors cursor-pointer",
        rowBgClass,
        selectionClass
      )}
      onClick={onSelect}
    >
      {/* Row number */}
      <td className="px-3 py-0 text-xs text-zinc-500 font-medium">{itemNumber}</td>

      {/* Question */}
      <td className="px-3 py-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-900 truncate max-w-xs">{question}</span>
          {hasNc && (
            <span
              className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 shrink-0"
              title="Non-conformità registrata"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              NC
            </span>
          )}
        </div>
      </td>

      {/* OK button */}
      <td className="px-3 py-0 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOutcomeChange("compliant");
          }}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded border-2 transition-colors",
            optimisticItem.outcome === "compliant"
              ? "border-green-600 bg-green-100 text-green-700"
              : "border-zinc-300 bg-white text-zinc-400 hover:border-green-300"
          )}
          title="Compliant"
        >
          <Check className="w-4 h-4" />
        </button>
      </td>

      {/* NOK button */}
      <td className="px-3 py-0 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOutcomeChange("non_compliant");
          }}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded border-2 transition-colors",
            optimisticItem.outcome === "non_compliant"
              ? "border-red-600 bg-red-100 text-red-700"
              : "border-zinc-300 bg-white text-zinc-400 hover:border-red-300"
          )}
          title="Non-compliant"
        >
          <X className="w-4 h-4" />
        </button>
      </td>

      {/* N/A button */}
      <td className="px-3 py-0 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOutcomeChange("not_applicable");
          }}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded border-2 transition-colors",
            optimisticItem.outcome === "not_applicable"
              ? "border-gray-600 bg-gray-100 text-gray-700"
              : "border-zinc-300 bg-white text-zinc-400 hover:border-gray-300"
          )}
          title="Not applicable"
        >
          <Minus className="w-4 h-4" />
        </button>
      </td>

      {/* Notes + speech-to-text mic */}
      <td className="px-3 py-0">
        <div className="flex items-center gap-1">
          <Input
            type="text"
            value={optimisticItem.notes}
            onChange={(e) => {
              e.stopPropagation();
              handleNotesChange(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder="Notes..."
            className="h-7 text-xs placeholder:text-zinc-400 border-zinc-300 focus:ring-1 flex-1"
          />
          {isSupported && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                isListening ? stopListening() : startListening();
              }}
              className={cn(
                "inline-flex items-center justify-center w-6 h-6 rounded transition-colors shrink-0",
                isListening
                  ? "bg-red-100 text-red-600"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
              title={isListening ? "Stop dettatura" : "Dettatura voce"}
            >
              {/* Reuse Mic icon but this is speech-to-text, not audio recording */}
              <svg className={cn("w-3.5 h-3.5", isListening && "animate-pulse")} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          )}
        </div>
      </td>

      {/* Media actions: camera + audio recorder */}
      <td className="px-3 py-0">
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <MediaCapture
            itemId={id}
            auditId={auditId}
            currentUrl={optimisticItem.evidenceUrl}
            path={path}
            onUrlChange={(newUrl) =>
              startTransition(() => setOptimisticItem({ evidenceUrl: newUrl }))
            }
          />
          <AudioRecorder
            itemId={id}
            auditId={auditId}
            currentUrl={optimisticItem.audioUrl}
            path={path}
            onUrlChange={(newUrl) =>
              startTransition(() => setOptimisticItem({ audioUrl: newUrl }))
            }
          />
        </div>
      </td>
    </tr>
  );
}
