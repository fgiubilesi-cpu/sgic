"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Mic, Square, Loader2, Trash2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadChecklistMedia, deleteChecklistMedia } from "@/features/audits/actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type RecorderStatus = "idle" | "recording" | "uploading" | "saved";

interface AudioRecorderProps {
  itemId: string;
  auditId: string;
  currentUrl?: string | null;
  path: string;
  onUrlChange?: (url: string | null) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function AudioRecorder({
  itemId,
  auditId,
  currentUrl,
  path,
  onUrlChange,
}: AudioRecorderProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [duration, setDuration] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prefer webm/opus, fallback to default
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        uploadAudio();
      };

      recorder.start(250); // collect chunks every 250ms
      setStatus("recording");
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        toast.error("Permesso microfono negato. Abilita l'accesso al microfono nelle impostazioni.");
      } else {
        toast.error("Impossibile avviare la registrazione.");
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
    setStatus("uploading");
  };

  const uploadAudio = async () => {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const file = new File([blob], "audio.webm", { type: "audio/webm" });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("itemId", itemId);
      formData.append("auditId", auditId);
      formData.append("type", "audio");
      formData.append("path", path);

      const result = await uploadChecklistMedia(formData);

      if (!result.success) {
        toast.error(result.error ?? "Upload audio fallito.");
        setStatus("idle");
        return;
      }

      setUrl(result.url ?? null);
      onUrlChange?.(result.url ?? null);
      setStatus("saved");
      toast.success("Audio salvato.");
    } catch {
      toast.error("Errore durante l'upload dell'audio.");
      setStatus("idle");
    }
  };

  const handleDelete = async () => {
    setStatus("uploading"); // reuse uploading state for loading indicator
    try {
      const formData = new FormData();
      formData.append("itemId", itemId);
      formData.append("auditId", auditId);
      formData.append("type", "audio");
      formData.append("path", path);

      const result = await deleteChecklistMedia(formData);

      if (!result.success) {
        toast.error(result.error ?? "Eliminazione fallita.");
        setStatus("saved");
        return;
      }

      setUrl(null);
      onUrlChange?.(null);
      setStatus("idle");
      setDuration(0);
      setDialogOpen(false);
      toast.success("Audio eliminato.");
    } catch {
      toast.error("Errore durante l'eliminazione.");
      setStatus("saved");
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (url || status === "saved") {
      setDialogOpen(true);
      return;
    }
    if (status === "recording") {
      stopRecording();
    } else if (status === "idle") {
      startRecording();
    }
  };

  const isLoading = status === "uploading";

  return (
    <>
      {/* Mic trigger button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isLoading}
        title={
          status === "recording"
            ? `Registrando… ${formatDuration(duration)} — clicca per fermare`
            : url || status === "saved"
            ? "Ascolta / elimina audio"
            : "Registra nota audio"
        }
        className={cn(
          "inline-flex items-center justify-center w-6 h-6 rounded transition-colors shrink-0",
          status === "recording"
            ? "bg-red-100 text-red-600"
            : url || status === "saved"
            ? "bg-green-100 text-green-700"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : status === "recording" ? (
          <Square className="w-3 h-3 fill-current" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Duration badge while recording */}
      {status === "recording" && (
        <span className="text-[10px] font-mono text-red-600 tabular-nums leading-none">
          {formatDuration(duration)}
        </span>
      )}

      {/* Playback dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nota audio</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {url && (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <audio controls src={url} className="w-full" />
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                setDialogOpen(false);
                // Allow user to record a new one (reset state first)
                setTimeout(() => {
                  setUrl(null);
                  setStatus("idle");
                  startRecording();
                }, 200);
              }}
            >
              <Mic className="w-3.5 h-3.5" />
              Ri-registra
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              disabled={isLoading}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
