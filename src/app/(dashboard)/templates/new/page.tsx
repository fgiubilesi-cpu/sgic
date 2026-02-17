"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client"; // Assicurati che esista o usa l'action

export default function NewTemplatePage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Recuperiamo l'organizzazione dell'utente
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user?.id).single();

      // 2. Inseriamo il template
      const { data, error } = await supabase
        .from("checklist_templates")
        .insert({ title, description, organization_id: profile?.organization_id })
        .select()
        .single();

      if (error) throw error;

      toast.success("Template creato! Ora aggiungi le domande.");
      router.push(`/templates/${data.id}`);
    } catch (error) {
      toast.error("Errore durante la creazione");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Crea Nuovo Template</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Titolo del Template</label>
          <Input 
            placeholder="es. Ispezione Sicurezza Cantieri" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Descrizione (opzionale)</label>
          <Textarea 
            placeholder="Descrivi lo scopo di questa checklist..." 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
          />
        </div>
        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading}>
            {loading ? "Salvataggio..." : "Crea e procedi"}
          </Button>
          <Button variant="ghost" type="button" onClick={() => router.back()}>Annulla</Button>
        </div>
      </form>
    </div>
  );
}