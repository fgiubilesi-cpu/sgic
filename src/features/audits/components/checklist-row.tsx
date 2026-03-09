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
import type { AuditOutcome } from "@/features/audits/schemas/audit-schema";

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
  readOnly?: boolean;
}

type OptimisticState = {
  outcome: AuditOutcome;
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
  readOnly = false,
}: ChecklistRowProps) {
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isListening, transcript, startListening, stopListening, isSupported } =
    useSpeechRecognition();

  // BUG-1 FIX: local state for notes — never reset by useOptimistic transitions
  const [localNotes, setLocalNotes] = useState(initialNotes ?? "");

  const [optimisticItem, setOptimisticItem] = useOptimistic<
    OptimisticState,
    Partial<OptimisticState>
  >(
    {
      outcome: initialOutcome,
      evidenceUrl: initialEvidenceUrl,
      audioUrl: initialAudioUrl,
    },
    (state, newValues) => ({ ...state, ...newValues })
  );

  // BUG-2 FIX: appendTranscript uses localNotes ref to avoid stale closure
  const localNotesRef = useRef(localNotes);
  useEffect(() => {
    localNotesRef.current = localNotes;
  }, [localNotes]);

  const saveNotes = useCallback(
    (notes: string) => {
      const formData = new FormData();
      formData.append("itemId", id);
      formData.append("notes", notes);
      formData.append("path", path);
      updateChecklistItem(formData).then((result) => {
        if ("error" in result) {
          toast.error(result.error ?? "Failed to save note.");
        } else {
          toast.success("Note salvate.");
        }
      });
    },
    [id, path]
  );

  const appendTranscript = useCallback(
    (text: string) => {
      const current = localNotesRef.current;
      const newNotes = current ? `${current} ${text}` : text;
      setLocalNotes(newNotes);
      saveNotes(newNotes);
    },
    [saveNotes]
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
    if ("error" in result) {
      toast.error(result.error ?? "Failed to save outcome.");
    } else if (result.ncCreated) {
      toast.info("Non conformità registrata automaticamente.");
    } else if (result.ncCancelled) {
      toast.info("Non conformità annullata.");
    }
  };

  const handleNotesChange = (newNotes: string) => {
    // BUG-1 FIX: update local state directly — no useOptimistic for notes
    setLocalNotes(newNotes);

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      saveNotes(newNotes);
    }, 500);
  };

  const isEvenRow = itemNumber % 2 === 0;
  const rowBgClass = isEvenRow ? "bg-white" : "bg-zinc-50";

  // Border color based on outcome state
  const stateBorderClass =
    optimisticItem.outcome === "compliant" ? "border-l-green-500" :
    optimisticItem.outcome === "non_compliant" ? "border-l-red-500" :
    optimisticItem.outcome === "not_applicable" ? "border-l-gray-300" :
    "border-l-transparent";

  return (
    <tr
      className={cn(
        "group h-11 border-b border-zinc-200 hover:bg-zinc-100 transition-colors cursor-pointer border-l-4",
        rowBgClass,
        stateBorderClass
      )}
      onClick={onSelect}
    >
      {/* Row number */}
      <td className="px-3 py-0 text-xs text-zinc-500 font-medium">{itemNumber}</td>

      {/* Question */}
      <td className="px-3 py-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-zinc-900 lg:whitespace-normal lg:break-words line-clamp-2 lg:line-clamp-none max-w-xs lg:max-w-none">{question}</span>
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
          disabled={readOnly}
          onClick={(e) => {
            e.stopPropagation();
            handleOutcomeChange("compliant");
          }}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded border-2 transition-colors",
            readOnly && "opacity-50 cursor-not-allowed",
            optimisticItem.outcome === "compliant"
              ? "border-green-600 bg-green-100 text-green-700"
              : "border-zinc-300 bg-white text-zinc-400 hover:border-green-300"
          )}
          title={readOnly ? "Modalità sola lettura" : "Compliant"}
        >
          <Check className="w-4 h-4" />
        </button>
      </td>

      {/* NOK button */}
      <td className="px-3 py-0 text-center">
        <button
          disabled={readOnly}
          onClick={(e) => {
            e.stopPropagation();
            handleOutcomeChange("non_compliant");
          }}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded border-2 transition-colors",
            readOnly && "opacity-50 cursor-not-allowed",
            optimisticItem.outcome === "non_compliant"
              ? "border-red-600 bg-red-100 text-red-700"
              : "border-zinc-300 bg-white text-zinc-400 hover:border-red-300"
          )}
          title={readOnly ? "Modalità sola lettura" : "Non-compliant"}
        >
          <X className="w-4 h-4" />
        </button>
      </td>

      {/* N/A button */}
      <td className="px-3 py-0 text-center">
        <button
          disabled={readOnly}
          onClick={(e) => {
            e.stopPropagation();
            handleOutcomeChange("not_applicable");
          }}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded border-2 transition-colors",
            readOnly && "opacity-50 cursor-not-allowed",
            optimisticItem.outcome === "not_applicable"
              ? "border-gray-600 bg-gray-100 text-gray-700"
              : "border-zinc-300 bg-white text-zinc-400 hover:border-gray-300"
          )}
          title={readOnly ? "Modalità sola lettura" : "Not applicable"}
        >
          <Minus className="w-4 h-4" />
        </button>
      </td>

      {/* Notes + speech-to-text mic */}
      <td className="px-3 py-0">
        <div className="flex items-center gap-1">
          <Input
            type="text"
            disabled={readOnly}
            value={localNotes}
            onChange={(e) => {
              e.stopPropagation();
              handleNotesChange(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            placeholder={readOnly ? "Sola lettura" : "Notes..."}
            className={cn(
              "h-7 text-xs placeholder:text-zinc-400 border-zinc-300 focus:ring-1 flex-1",
              readOnly && "opacity-60 cursor-not-allowed"
            )}
          />
          {isSupported && !readOnly && (
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
              title={isListening ? "Ferma dettatura" : "Dettatura voce"}
            >
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
          className={cn(
            "flex items-center gap-1 transition-opacity",
            readOnly ? "hidden" : "opacity-0 group-hover:opacity-100 group-hover:group-focus:opacity-100"
          )}
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
