"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Loader2, Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { createAuditFromTemplate } from "@/features/audits/actions";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  title: z.string().min(2, "Titolo obbligatorio"),
  scheduled_date: z.string().min(1, "Data obbligatoria"),
  templateId: z.string().min(1, "Seleziona un modello"),
});

export function CreateAuditSheet() {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      scheduled_date: new Date().toISOString().split("T")[0],
      templateId: "",
    },
  });

  useEffect(() => {
    async function fetchTemplates() {
      if (!open) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("id, title")
        .order('title');
      
      if (data) setTemplates(data);
      if (error) toast.error("Errore caricamento template");
      setIsLoading(false);
    }
    fetchTemplates();
  }, [open, supabase]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const result = await createAuditFromTemplate({
        title: values.title,
        scheduled_date: values.scheduled_date,
        templateId: values.templateId,
      });

      if (result.success) {
        toast.success("Audit creato!");
        setOpen(false);
        form.reset();
        router.refresh();
        router.push(`/audits/${result.auditId}`);
      }
    } catch (err) {
      toast.error("Errore salvataggio");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-zinc-900 text-white gap-2">
          <Plus className="h-4 w-4" /> Nuovo Audit
        </Button>
      </SheetTrigger>
      
      {/* 1. pointer-events-auto permette il click sui componenti portalizzati */}
      <SheetContent className="w-full sm:max-w-[450px] pointer-events-auto">
        <SheetHeader className="text-left border-b pb-4">
          <SheetTitle className="text-xl">Nuovo Audit</SheetTitle>
          <SheetDescription>
            Configura l'ispezione partendo da un modello.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
            
            {/* DEBUG: Rimuovi questo div una volta verificato che i template ci sono */}
            <div className="flex items-center gap-2 text-[10px] bg-blue-50 text-blue-700 p-2 rounded border border-blue-100">
              <Database className="w-3 h-3" />
              Status: {templates.length} template caricati nel menu.
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo dell'audit</FormLabel>
                  <FormControl>
                    <Input placeholder="es. Verifica Trimestrale" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduled_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data pianificata</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="templateId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modello Checklist</FormLabel>
                  {/* 2. modal={false} risolve il problema del click bloccato nello Sheet */}
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    modal={false}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-white border-zinc-200">
                        <SelectValue placeholder="Seleziona..." />
                      </SelectTrigger>
                    </FormControl>
                    {/* 3. position="popper" e z-index forzato */}
                    <SelectContent position="popper" className="z-[100] max-h-[200px]">
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="cursor-pointer">
                          {t.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-11 bg-zinc-900" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crea Audit"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}