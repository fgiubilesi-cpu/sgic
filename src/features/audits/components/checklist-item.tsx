"use client";

import { useState, useRef, useOptimistic, startTransition, useEffect } from "react";
import { toast } from "sonner";
import { Camera, Mic, Image as ImageIcon, Loader2, Check, X, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
// 👇 FIX IMPORT: Puntiamo al file specifico, non alla cartella generica
import { updateChecklistItem } from "@/features/audits/actions";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { AuditOutcome, OUTCOME_COLORS } from "@/types/database.types";

interface ChecklistItemProps {
  id: string;
  question: string;
  initialOutcome: AuditOutcome;
  initialNotes: string | null;
  initialEvidenceUrl: string | null;
  auditId: string;
  path: string; 
}

export function ChecklistItem({ 
  id, 
  question, 
  initialOutcome, 
  initialNotes, 
  initialEvidenceUrl,
  auditId,
  path 
}: ChecklistItemProps) {
  
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();
  const [isUploading, setIsUploading] = useState(false);

  const [optimisticItem, setOptimisticItem] = useOptimistic(
    { 
      outcome: initialOutcome, 
      notes: initialNotes || "", 
      evidenceUrl: initialEvidenceUrl 
    },
    (state, newValues: Partial<typeof state>) => ({ ...state, ...newValues })
  );

  useEffect(() => {
    if (transcript) {
      const newNotes = optimisticItem.notes ? `${optimisticItem.notes} ${transcript}` : transcript;
      handleNotesChange(newNotes);
    }
  }, [transcript]);

  const handleOutcomeChange = async (newOutcome: AuditOutcome) => {
    startTransition(() => {
      setOptimisticItem({ outcome: newOutcome });
    });

    const formData = new FormData();
    formData.append("itemId", id);
    formData.append("outcome", newOutcome);
    formData.append("path", path);

    await updateChecklistItem(formData);
  };

  const handleNotesChange = (newNotes: string) => {
    startTransition(() => {
      setOptimisticItem({ notes: newNotes });
    });
  };

  const saveNotes = async () => {
    if (optimisticItem.notes === initialNotes) return;
    
    const formData = new FormData();
    formData.append("itemId", id);
    formData.append("notes", optimisticItem.notes);
    formData.append("path", path);
    
    await updateChecklistItem(formData);
    toast.success("Nota salvata");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
  
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${auditId}/${id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("audit-evidence")
        .upload(fileName, file);
  
      if (uploadError) throw uploadError;
  
      const { data: { publicUrl } } = supabase.storage
        .from("audit-evidence")
        .getPublicUrl(fileName);
  
      startTransition(() => {
        setOptimisticItem({ evidenceUrl: publicUrl });
      });

      const formData = new FormData();
      formData.append("itemId", id);
      formData.append("evidenceUrl", publicUrl);
      formData.append("path", path);
      
      await updateChecklistItem(formData);
      toast.success("Foto caricata");

    } catch (error: any) {
      toast.error("Errore upload: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn(
      "group border rounded-lg p-4 mb-3 transition-all duration-300", 
      OUTCOME_COLORS[optimisticItem.outcome]
    )}>
      <div className="flex flex-col gap-4">
        
        <div className="flex justify-between items-start gap-4">
          <h3 className="font-medium text-slate-900 leading-snug">{question}</h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
           <Button
            type="button"
            variant="ghost"
            onClick={() => handleOutcomeChange('compliant')}
            className={cn("h-10 border-2", optimisticItem.outcome === 'compliant' ? "border-green-600 bg-green-100 text-green-700" : "border-transparent bg-white/50")}
           >
             <Check className="mr-2 w-4 h-4" /> OK
           </Button>

           <Button
            type="button"
            variant="ghost"
            onClick={() => handleOutcomeChange('non_compliant')}
            className={cn("h-10 border-2", optimisticItem.outcome === 'non_compliant' ? "border-red-600 bg-red-100 text-red-700" : "border-transparent bg-white/50")}
           >
             <X className="mr-2 w-4 h-4" /> NOK
           </Button>

           <Button
            type="button"
            variant="ghost"
            onClick={() => handleOutcomeChange('not_applicable')}
            className={cn("h-10 border-2", optimisticItem.outcome === 'not_applicable' ? "border-gray-600 bg-gray-100 text-gray-700" : "border-transparent bg-white/50")}
           >
             <Minus className="mr-2 w-4 h-4" /> N/A
           </Button>
        </div>

        <div className="grid grid-cols-12 gap-3">
            <div className="col-span-9 md:col-span-10">
                <Textarea 
                    value={optimisticItem.notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    onBlur={saveNotes}
                    placeholder="Note o detta..."
                    className="min-h-[50px] bg-white/80 resize-none"
                />
            </div>
            
            <div className="col-span-3 md:col-span-2 flex flex-col gap-2">
                <Button 
                    variant={isListening ? "destructive" : "secondary"} 
                    size="icon" 
                    className="w-full h-full max-h-[50px]"
                    onClick={() => isListening ? stopListening() : startListening()}
                >
                    <Mic className={cn("w-5 h-5", isListening && "animate-pulse")} />
                </Button>
            </div>
        </div>

        <div className="flex items-center gap-3 mt-1">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment" 
                onChange={handleFileChange}
            />

            <Button 
                variant="outline" 
                className={cn("gap-2", optimisticItem.evidenceUrl && "text-blue-600 border-blue-200 bg-blue-50")}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
            >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {optimisticItem.evidenceUrl ? "Cambia Foto" : "Aggiungi Foto"}
            </Button>

            {optimisticItem.evidenceUrl && (
                <div className="relative group/img">
                    <img 
                        src={optimisticItem.evidenceUrl} 
                        alt="Evidence" 
                        className="h-10 w-10 object-cover rounded border cursor-pointer hover:scale-150 transition-transform origin-bottom-left"
                        onClick={() => window.open(optimisticItem.evidenceUrl!, '_blank')}
                    />
                </div>
            )}
        </div>

      </div>
    </div>
  );
}