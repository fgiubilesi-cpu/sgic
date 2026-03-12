"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Plus, Trash2, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadChecklistMedia, deleteChecklistMedia } from "@/features/audits/actions";
import { compressEvidenceImage } from "@/lib/utils/compress-image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSync } from "@/lib/offline/sync-provider";
import { patchOfflineAuditChecklistItem } from "@/lib/offline/audit-cache";
import { db } from "@/lib/offline/db";
import {
  getMediaKindFromMimeType,
  isVideoMedia,
  sortChecklistItemMedia,
  type ChecklistItemMedia,
} from "@/features/audits/lib/checklist-media";

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
  currentMedia?: ChecklistItemMedia[];
  path: string;
  onMediaChange?: (media: ChecklistItemMedia[]) => void;
  readOnly?: boolean;
}

function getMediaCountLabel(count: number) {
  if (count === 1) return "1 allegato";
  return `${count} allegati`;
}

export function MediaCapture({
  itemId,
  auditId,
  currentMedia = [],
  path,
  onMediaChange,
  readOnly = false,
}: MediaCaptureProps) {
  const [media, setMedia] = useState<ChecklistItemMedia[]>(sortChecklistItemMedia(currentMedia));
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(currentMedia[0]?.id ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueMutation, isOnline } = useSync();

  useEffect(() => {
    const sortedMedia = sortChecklistItemMedia(currentMedia);
    setMedia(sortedMedia);
    setSelectedMediaId((currentSelected) =>
      currentSelected && sortedMedia.some((item) => item.id === currentSelected)
        ? currentSelected
        : sortedMedia[0]?.id ?? null
    );
  }, [currentMedia]);

  const selectedMedia = media.find((item) => item.id === selectedMediaId) ?? media[0] ?? null;

  const syncLocalMedia = async (nextMedia: ChecklistItemMedia[]) => {
    const sortedMedia = sortChecklistItemMedia(nextMedia);
    setMedia(sortedMedia);
    onMediaChange?.(sortedMedia);
    await patchOfflineAuditChecklistItem({
      auditId,
      itemId,
      patch: {
        media: sortedMedia,
      },
    });
  };

  const openFilePicker = () => {
    if (readOnly) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      let uploadFile: File = file;
      if (file.type.startsWith("image/")) {
        uploadFile = await compressEvidenceImage(file);
      }

      if (!isOnline) {
        if (!uploadFile.type.startsWith("image/")) {
          toast.info("Offline supporta solo foto. Video ed altri media richiedono connessione.");
          return;
        }

        const localMediaId = `offline-${crypto.randomUUID()}`;
        const previewUrl = await fileToDataUrl(uploadFile);
        const offlineMedia: ChecklistItemMedia = {
          id: localMediaId,
          checklist_item_id: itemId,
          audit_id: auditId,
          organization_id: "offline",
          storage_path: null,
          mime_type: uploadFile.type || null,
          media_kind: getMediaKindFromMimeType(uploadFile.type),
          created_at: new Date().toISOString(),
          access_url: previewUrl,
          original_name: uploadFile.name,
          pending_sync: true,
          source: "offline",
        };

        await enqueueMutation("UPLOAD_CHECKLIST_MEDIA", {
          auditId,
          file: uploadFile,
          itemId,
          localMediaId,
          path,
        });

        const nextMedia = [offlineMedia, ...media];
        await syncLocalMedia(nextMedia);
        setSelectedMediaId(localMediaId);
        setDialogOpen(true);
        toast.success("Foto salvata offline. Verrà caricata appena torna la connessione.");
        return;
      }

      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("itemId", itemId);
      formData.append("auditId", auditId);
      formData.append("path", path);

      const result = await uploadChecklistMedia(formData);
      if (!result.success) {
        toast.error(result.error ?? "Upload fallito.");
        return;
      }

      const nextMedia = [
        result.media,
        ...media.filter((item) => item.id !== result.media.id),
      ];
      await syncLocalMedia(nextMedia);
      setSelectedMediaId(result.media.id);
      setDialogOpen(true);
      toast.success("File caricato.");
    } catch (error) {
      console.error(error);
      toast.error("Errore durante l'upload.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePendingLocalMedia = async (target: ChecklistItemMedia) => {
    const pendingUploads = await db.sync_queue.where("actionType").equals("UPLOAD_CHECKLIST_MEDIA").toArray();
    const relatedUploads = pendingUploads.filter(
      (item) =>
        item.payload?.auditId === auditId &&
        item.payload?.itemId === itemId &&
        item.payload?.localMediaId === target.id
    );

    if (relatedUploads.length > 0) {
      await db.sync_queue.bulkDelete(relatedUploads.map((item) => item.id));
    }

    const nextMedia = media.filter((item) => item.id !== target.id);
    await syncLocalMedia(nextMedia);
    setSelectedMediaId(nextMedia[0]?.id ?? null);
    if (nextMedia.length === 0) {
      setDialogOpen(false);
    }
    toast.success("Allegato in coda rimosso.");
  };

  const handleDelete = async (target = selectedMedia) => {
    if (!target) return;

    if (target.pending_sync || target.id.startsWith("offline-")) {
      await removePendingLocalMedia(target);
      return;
    }

    if (!isOnline) {
      toast.info("La rimozione di media già sincronizzati richiede connessione.");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("mediaId", target.id);
      formData.append("itemId", itemId);
      formData.append("path", path);

      const result = await deleteChecklistMedia(formData);
      if (!result.success) {
        toast.error(result.error ?? "Eliminazione fallita.");
        return;
      }

      const nextMedia = media.filter((item) => item.id !== result.deletedId);
      await syncLocalMedia(nextMedia);
      setSelectedMediaId(nextMedia[0]?.id ?? null);
      if (nextMedia.length === 0) {
        setDialogOpen(false);
      }
      toast.success("File eliminato.");
    } catch (error) {
      console.error(error);
      toast.error("Errore durante l'eliminazione.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (media.length > 0) {
              setDialogOpen(true);
              return;
            }
            openFilePicker();
          }}
          disabled={isLoading || (readOnly && media.length === 0)}
          title={
            media.length > 0
              ? `Vedi ${getMediaCountLabel(media.length)}`
              : readOnly
                ? "Nessun allegato"
                : "Aggiungi foto o video"
          }
          className={cn(
            "inline-flex items-center justify-center h-7 w-7 rounded-full border transition-colors shrink-0",
            media.length > 0
              ? "border-sky-200 bg-sky-100 text-sky-700 hover:bg-sky-200"
              : "border-zinc-200 bg-zinc-100 text-zinc-500 hover:bg-zinc-200",
            readOnly && media.length === 0 && "cursor-not-allowed opacity-50"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
        </button>

        {media.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-sky-600 px-1 text-[10px] font-semibold text-white">
            {media.length}
          </span>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Evidenze del rigo</DialogTitle>
            <DialogDescription>
              {media.length > 0
                ? `${getMediaCountLabel(media.length)} collegati a questa verifica.`
                : "Nessun allegato disponibile."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-lg bg-zinc-100">
              {selectedMedia ? (
                isVideoMedia(selectedMedia) ? (
                  <video
                    src={selectedMedia.access_url ?? undefined}
                    controls
                    className="max-h-[28rem] w-full rounded-lg bg-black object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedMedia.access_url ?? undefined}
                    alt={selectedMedia.original_name ?? "Evidenza"}
                    className="max-h-[28rem] w-full object-contain"
                  />
                )
              ) : (
                <div className="px-6 py-10 text-center text-sm text-zinc-500">
                  Nessun allegato disponibile per questo rigo.
                </div>
              )}
            </div>

            {media.length > 0 && (
              <div className="grid max-h-48 grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-5">
                {media.map((item) => {
                  const active = item.id === selectedMedia?.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedMediaId(item.id)}
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-lg border bg-zinc-100 transition",
                        active ? "border-sky-500 ring-2 ring-sky-200" : "border-zinc-200 hover:border-zinc-300"
                      )}
                    >
                      {isVideoMedia(item) ? (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-900 text-white">
                          <Video className="h-5 w-5" />
                        </div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.access_url ?? undefined}
                          alt={item.original_name ?? "Anteprima allegato"}
                          className="h-full w-full object-cover"
                        />
                      )}
                      {item.pending_sync ? (
                        <span className="absolute bottom-1 left-1 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-medium text-white">
                          In coda
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {!readOnly ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  openFilePicker();
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                {isOnline ? "Aggiungi media" : "Aggiungi foto offline"}
              </Button>
            ) : (
              <div />
            )}

            {!readOnly && selectedMedia ? (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                disabled={isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(selectedMedia);
                }}
              >
                {isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Elimina selezionato
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
