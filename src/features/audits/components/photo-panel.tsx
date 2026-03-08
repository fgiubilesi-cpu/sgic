"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadEvidencePhoto } from "@/features/audits/actions";
import { compressEvidenceImage } from "@/lib/utils/compress-image";

interface PhotoPanelProps {
  itemId: string;
  auditId: string;
  onClose: () => void;
}

export function PhotoPanel({ itemId, auditId, onClose }: PhotoPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const compressedFile = await compressEvidenceImage(file);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("auditId", auditId);
      formData.append("itemId", itemId);

      const result = await uploadEvidencePhoto(formData);

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Photo uploaded.");
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error("Upload failed: " + message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900">Add Photo</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-600 mb-4">
          Upload evidence photo for this checklist item.
        </p>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
        />

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full gap-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Camera className="w-4 h-4" />
              Choose Photo
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
