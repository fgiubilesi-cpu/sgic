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
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Loader2 } from "lucide-react";

export function NCForm({ onSuccess }: { onSuccess?: () => void }) {
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const form = useForm<z.input<typeof nonConformitySchema>, unknown, z.infer<typeof nonConformitySchema>>({
        resolver: zodResolver(nonConformitySchema),
        defaultValues: {
            title: "",
            description: "",
            identified_date: new Date().toISOString().split("T")[0],
            severity: "minor",
            status: "open",
        },
    });

    const { mutateAsync: createOfflineNC } = useOfflineMutation({
        actionType: 'CREATE_NC',
        generateOfflineId: () => crypto.randomUUID(),
        mutationFn: async (mutationData: z.infer<typeof nonConformitySchema>) => {
            return createNC(mutationData);
        }
    });

    async function onSubmit(data: z.infer<typeof nonConformitySchema>) {
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

                <div className="rounded-lg border border-dashed bg-zinc-50 px-4 py-3 text-sm text-muted-foreground">
                    Registriamo solo i dati essenziali per aprire la NC. Analisi causa radice e piano operativo
                    si definiscono nella scheda di dettaglio insieme alle azioni correttive.
                </div>

                <Button type="submit" className="w-full mt-6" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Apri Non Conformità"}
                </Button>
            </form>
        </Form>
    );
}
