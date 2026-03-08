"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trainingRecordSchema, type TrainingRecord } from "../schemas/training-records.schema";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createTrainingRecord } from "../actions/training-actions";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { Tables } from "@/types/database.types";

type TrainingRecordFormProps = {
    personnel: Tables<"personnel">[];
    courses: Tables<"training_courses">[];
    onSuccess?: () => void;
    defaultPersonnelId?: string;
};

export function TrainingRecordForm({ personnel, courses, onSuccess, defaultPersonnelId }: TrainingRecordFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<TrainingRecord>({
        resolver: zodResolver(trainingRecordSchema),
        defaultValues: {
            personnel_id: defaultPersonnelId || "",
            course_id: "",
            completion_date: new Date().toISOString().split("T")[0],
            expiry_date: null,
            certificate_url: "",
        },
    });

    async function onSubmit(values: TrainingRecord) {
        setLoading(true);
        try {
            await createTrainingRecord(values);
            toast.success("Registrazione completata");
            onSuccess?.();
        } catch (error) {
            console.error(error);
            toast.error("Errore durante il salvataggio");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="personnel_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Dipendente</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleziona dipendente" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {personnel.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.first_name} {p.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="course_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Corso</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleziona corso" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {courses.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="completion_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Data Completamento</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="expiry_date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Scadenza (Opzionale)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(e.target.value || null)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="certificate_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Link Certificato (Opzionale)</FormLabel>
                            <FormControl>
                                <Input placeholder="https://..." {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {loading ? "Salvataggio..." : "Registra Formazione"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
