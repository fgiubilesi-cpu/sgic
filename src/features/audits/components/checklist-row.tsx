"use client";

import { useState, useRef, useOptimistic, startTransition, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Check, X, Minus, Paperclip, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { updateChecklistItem } from "@/features/audits/actions";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import type { AuditOutcome } from "@/types/database.types";

interface ChecklistRowProps {
  id: string;
  itemNumber: number;
  question: string;
  initialOutcome: AuditOutcome;
  initialNotes: string | null;
  initialEvidenceUrl: string | null;
  auditId: string;
  isSelected: boolean;
  onSelect: () => void;
  onPhotoClick: () => void;
  path: string;
}

type ChecklistRowState = {
  outcome: AuditOutcome;
  notes: string;
  evidenceUrl: string | null;
};

export function ChecklistRow({
  id,
  itemNumber,
  question,
  initialOutcome,
  initialNotes,
  initialEvidenceUrl,
  auditId,
  isSelected,
  onSelect,
  onPhotoClick,
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
      // Persist immediately
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

  // Cleanup debounce on unmount
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

    // Debounce save
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

  // Row background: zebra striping and selection
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
        <div className="text-xs text-zinc-900 truncate max-w-xs">{question}</div>
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

      {/* Notes input */}
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
                "inline-flex items-center justify-center w-6 h-6 rounded transition-colors",
                isListening
                  ? "bg-red-100 text-red-600"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
              title={isListening ? "Stop recording" : "Start dictation"}
            >
              <Mic className={cn("w-3.5 h-3.5", isListening && "animate-pulse")} />
            </button>
          )}
        </div>
      </td>

      {/* Photo icon */}
      <td className="px-3 py-0 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPhotoClick();
          }}
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 rounded transition-colors",
            optimisticItem.evidenceUrl
              ? "bg-blue-100 text-blue-600"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          )}
          title={optimisticItem.evidenceUrl ? "Manage photo" : "Add photo"}
        >
          <Paperclip className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
