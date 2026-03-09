"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    correctiveActionSchema
} from "../schemas/nc-ac.schema";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createAC } from "../actions/quality-actions";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Sparkles, Loader2 } from "lucide-react";
import { generateAIAnalysisForNC } from "../actions/analyze-nc";

export function ACForm({ ncId, onSuccess }: { ncId: string, onSuccess?: () => void }) {
    const [isPending, setIsPending] = useState(false);
    const [isAskingAI, setIsAskingAI] = useState(false);
    const router = useRouter();

    const form = useForm<z.input<typeof correctiveActionSchema>, unknown, z.infer<typeof correctiveActionSchema>>({
        resolver: zodResolver(correctiveActionSchema),
        defaultValues: {
            nc_id: ncId,
            description: "",
            due_date: "",
            status: "pending",
        },
    });

    const handleAskAI = async () => {
        setIsAskingAI(true);
        try {
            const aiResult = await generateAIAnalysisForNC(ncId);
            if (aiResult.success) {
                const currentDesc = form.getValues("description");
                const aiText = `**Analisi Cause Radice:**\n${aiResult.data.root_cause_analysis}\n\n**Piano d'Azione Proposto:**\n${aiResult.data.suggested_action_plan}`;
                form.setValue("description", currentDesc ? `${currentDesc}\n\n${aiText}` : aiText);
                toast.success("Analisi AI completata");
            } else {
                toast.error(aiResult.error || "Errore durante l'analisi AI");
            }
        } catch (error: any) {
            toast.error(error.message || "Errore durante l'analisi AI");
            console.error(error);
        } finally {
            setIsAskingAI(false);
        }
    };

    async function onSubmit(data: z.infer<typeof correctiveActionSchema>) {
        setIsPending(true);
        try {
            await createAC(data);
            toast.success("Azione Correttiva aggiunta");
            form.reset();
            onSuccess?.();
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'aggiunta dell'azione");
            console.error(error);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <div className="flex justify-between items-center">
                                <FormLabel>Descrizione Azione</FormLabel>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAskAI}
                                    disabled={isAskingAI}
                                    className="h-8 shadow-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                                >
                                    {isAskingAI ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                                    {isAskingAI ? "Analisi..." : "Ask AI (Root Cause)"}
                                </Button>
                            </div>
                            <FormControl>
                                <Textarea
                                    placeholder="Es: Sostituzione componente difettoso e ricalibrazione..."
                                    className="min-h-[150px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="due_date"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Scadenza (Opzionale)</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending ? "Salvataggio..." : "Aggiungi Azione Correttiva"}
                </Button>
            </form>
        </Form>
    );
}
