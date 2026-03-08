"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

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

import { createSampling } from "@/features/samplings/actions/sampling-actions";
import { samplingSchema } from "../schemas/samplings.schema";

export function CreateSamplingSheet() {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const form = useForm<z.input<typeof samplingSchema>, unknown, z.infer<typeof samplingSchema>>({
        resolver: zodResolver(samplingSchema),
        defaultValues: {
            title: "",
            matrix: "",
            sampling_date: new Date().toISOString().split("T")[0],
            location: "",
            operator_name: "",
            status: "planned",
        } as any,
    });

    async function onSubmit(values: z.infer<typeof samplingSchema>) {
        setIsLoading(true);
        try {
            const result = await createSampling(values);

            if (result.success) {
                toast.success("Campionamento creato!");
                setOpen(false);
                form.reset();
                router.refresh();
                if (result.data) {
                    router.push(`/samplings/${result.data.id}`);
                }
            } else {
                toast.error("Errore: " + result.error);
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
                    <Plus className="h-4 w-4" /> Nuovo Campionamento
                </Button>
            </SheetTrigger>

            <SheetContent className="w-full sm:max-w-[450px]">
                <SheetHeader className="text-left border-b pb-4">
                    <SheetTitle className="text-xl">Nuovo Campionamento</SheetTitle>
                    <SheetDescription>
                        Inserisci i dettagli del nuovo campionamento da pianificare.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Titolo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Es. Prelievo Acqua Pozzo" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="matrix"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Matrice</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Es. Acqua, Alimento, Aria" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="sampling_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Data Campionamento</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Luogo (Opzionale)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Es. Reparto Produzione" {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="operator_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Operatore (Opzionale)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nome del tecnico" {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full h-11 bg-zinc-900 text-white" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            {isLoading ? "Creazione..." : "Crea Campionamento"}
                        </Button>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
