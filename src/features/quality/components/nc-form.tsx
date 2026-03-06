"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    nonConformitySchema
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createNC } from "../actions/quality-actions";
import { useOfflineMutation } from "@/lib/offline/use-offline-mutation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Sparkles, Loader2 } from "lucide-react";
import { generateAIAnalysis } from "../actions/analyze-nc";

export function NCForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isPending, setIsPending] = useState(false);
    const [isAiPending, startAiTransition] = useTransition();
    const router = useRouter();

    const form = useForm<z.input<typeof nonConformitySchema>>({
        resolver: zodResolver(nonConformitySchema),
        defaultValues: {
            title: "",
            description: "",
            identified_date: new Date().toISOString().split("T")[0],
            severity: "minor",
            status: "open",
            root_cause_analysis: "",
            action_plan: "",
        },
    });

    const { mutateAsync: createOfflineNC } = useOfflineMutation({
        actionType: 'CREATE_NC',
        generateOfflineId: () => crypto.randomUUID(),
        mutationFn: async (mutationData: any) => {
            return createNC(mutationData);
        }
    });

    const handleAIAssist = () => {
        const title = form.getValues("title");
        const description = form.getValues("description");
        const severity = form.getValues("severity") || "minor";

        if (!title || !description) {
            toast.error("Inserisci Titolo e Descrizione per usare l'assistente AI.");
            return;
        }

        startAiTransition(async () => {
            const result = await generateAIAnalysis({ title, description, severity });
            if (result.success) {
                form.setValue("root_cause_analysis", result.data.root_cause_analysis, { shouldDirty: true, shouldValidate: true });
                form.setValue("action_plan", result.data.suggested_action_plan, { shouldDirty: true, shouldValidate: true });
                toast.success("Analisi AI completata!");
            } else {
                toast.error(result.error);
            }
        });
    };

    async function onSubmit(data: z.input<typeof nonConformitySchema>) {
        setIsPending(true);
        try {
            await createOfflineNC(data);
            toast.success("Non Conformità creata (o in coda) con successo");
            form.reset();
            onSuccess?.();
            router.refresh();
        } catch (error) {
            toast.error("Errore durante la creazione della NC");
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
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Titolo</FormLabel>
                            <FormControl>
                                <Input placeholder="Es: Malfunzionamento sensore X" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrizione</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Descrivi dettagliatamente l'accaduto..."
                                    className="min-h-[100px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="identified_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data Identificazione</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="severity"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gravità</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleziona gravità" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="minor">Minore</SelectItem>
                                        <SelectItem value="major">Maggiore</SelectItem>
                                        <SelectItem value="critical">Critica</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="pt-4 border-t mt-4">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-sm font-medium">Analisi Causa e Piano d'Azione</h3>
                            <p className="text-xs text-muted-foreground">Compila i campi o fatti aiutare dall'AI basandosi su titolo e descrizione.</p>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAIAssist}
                            disabled={isAiPending || isPending}
                            className="bg-primary/5 hover:bg-primary/10 text-primary border-primary/20"
                        >
                            {isAiPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            AI Assist: Suggerisci Cause
                        </Button>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="root_cause_analysis"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Analisi Cause Radice (Root Cause)</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Scrivi l'analisi delle cause..."
                                    className="min-h-[80px]"
                                    {...field}
                                    value={field.value || ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="action_plan"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Piano d'Azione Suggerito</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Descrivi il piano d'azione..."
                                    className="min-h-[80px]"
                                    {...field}
                                    value={field.value || ""}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full mt-6" disabled={isPending || isAiPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crea Non Conformità"}
                </Button>
            </form>
        </Form>
    );
}
