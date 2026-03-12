"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Trash2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadChecklistMedia, deleteChecklistMedia } from "@/features/audits/actions";
import { compressEvidenceImage } from "@/lib/utils/compress-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSync } from "@/lib/offline/sync-provider";
import { patchOfflineAuditChecklistItem } from "@/lib/offline/audit-cache";
import { db } from "@/lib/offline/db";

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(reader.error ?? new Error("Impossibile leggere il file."));
    reader.readAsDataURL(file);
  });
}

interface MediaCaptureProps {
  itemId: string;
  auditId: string;
  currentUrl?: string | null;
  path: string;
  onUrlChange?: (url: string | null) => void;
}

export function MediaCapture({
  itemId,
  auditId,
  currentUrl,
  path,
  onUrlChange,
}: MediaCaptureProps) {
  const [url, setUrl] = useState<string | null>(currentUrl ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOnline } = useSync();

  const isVideo = url
    ? /\.(mp4|webm|mov|avi)(\?|$)/i.test(url)
    : false;

  useEffect(() => {
    setUrl(currentUrl ?? null);
  }, [currentUrl]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isOnline) {
      if (!file.type.startsWith("image/")) {
        toast.info("Offline supporta solo foto. Video ed altri media richiedono connessione.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setIsLoading(true);
      try {
        const uploadFile = await compressEvidenceImage(file);
        const previewUrl = await fileToDataUrl(uploadFile);

        await db.sync_queue.add({
          actionType: "UPLOAD_CHECKLIST_MEDIA",
          createdAt: Date.now(),
          id: crypto.randomUUID(),
          payload: {
            auditId,
            file: uploadFile,
            itemId,
            path,
            type: "evidence",
          },
          status: "pending",
        });

        await patchOfflineAuditChecklistItem({
          auditId,
          itemId,
          patch: {
            evidence_url: previewUrl,
          },
        });

        setUrl(previewUrl);
        onUrlChange?.(previewUrl);
        toast.success("Foto salvata offline. Verrà caricata appena torna la connessione.");
      } catch {
        toast.error("Impossibile salvare la foto offline.");
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      return;
    }

    setIsLoading(true);
    try {
      let uploadFile: File = file;

      // Comprimi solo le immagini
      if (file.type.startsWith("image/")) {
        uploadFile = await compressEvidenceImage(file);
      }

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("itemId", itemId);
      formData.append("auditId", auditId);
      formData.append("type", "evidence");
      formData.append("path", path);

      const result = await uploadChecklistMedia(formData);

      if (!result.success) {
        toast.error(result.error ?? "Upload fallito.");
        return;
      }

      setUrl(result.url ?? null);
      onUrlChange?.(result.url ?? null);
      toast.success("File caricato.");
    } catch {
      toast.error("Errore durante l'upload.");
    } finally {
      setIsLoading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    if (!isOnline) {
      const pendingUploads = await db.sync_queue
        .where("actionType")
        .equals("UPLOAD_CHECKLIST_MEDIA")
        .toArray();

      const relatedUploads = pendingUploads.filter(
        (item) =>
          item.payload?.auditId === auditId &&
          item.payload?.itemId === itemId &&
          item.payload?.type === "evidence"
      );

      if (relatedUploads.length === 0) {
        toast.info("La rimozione di media già sincronizzati richiede connessione.");
        return;
      }

      await db.sync_queue.bulkDelete(relatedUploads.map((item) => item.id));
      await patchOfflineAuditChecklistItem({
        auditId,
        itemId,
        patch: {
          evidence_url: null,
        },
      });
      setUrl(null);
      onUrlChange?.(null);
      setDialogOpen(false);
      toast.success("Foto offline rimossa.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("itemId", itemId);
      formData.append("auditId", auditId);
      formData.append("type", "evidence");
      formData.append("path", path);

      const result = await deleteChecklistMedia(formData);

      if (!result.success) {
        toast.error(result.error ?? "Eliminazione fallita.");
        return;
      }

      setUrl(null);
      onUrlChange?.(null);
      setDialogOpen(false);
      toast.success("File eliminato.");
    } catch {
      toast.error("Errore durante l'eliminazione.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Trigger button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isOnline) {
            toast.info("Le evidenze media offline non sono ancora supportate.");
            return;
          }
          if (url) {
            setDialogOpen(true);
          } else {
            fileInputRef.current?.click();
          }
        }}
        disabled={isLoading}
        title={url ? "Vedi/elimina media" : "Allega foto o video"}
        className={cn(
          "inline-flex items-center justify-center w-6 h-6 rounded transition-colors shrink-0",
          url
            ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Camera className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Preview dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Evidenza fotografica</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center bg-zinc-100 rounded-md overflow-hidden min-h-48">
            {url && !isVideo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt="Evidence"
                className="max-h-80 w-full object-contain"
              />
            )}
            {url && isVideo && (
              <video
                src={url}
                controls
                className="max-h-80 w-full"
              />
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
                // Delay to avoid dialog animation conflict
                setTimeout(() => fileInputRef.current?.click(), 150);
              }}
            >
              <Play className="w-3.5 h-3.5" />
              Sostituisci
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
