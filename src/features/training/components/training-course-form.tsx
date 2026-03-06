"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { trainingCourseSchema, type TrainingCourse } from "../schemas/training-courses.schema";
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
import { createTrainingCourse } from "../actions/training-actions";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";

type TrainingCourseFormProps = {
    onSuccess?: () => void;
};

export function TrainingCourseForm({ onSuccess }: TrainingCourseFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<TrainingCourse>({
        resolver: zodResolver(trainingCourseSchema),
        defaultValues: {
            title: "",
            duration_hours: 1,
            validity_months: 12,
            category: "safety",
        },
    });

    async function onSubmit(values: TrainingCourse) {
        setLoading(true);
        try {
            await createTrainingCourse(values);
            toast.success("Corso creato correttamente");
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
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Titolo Corso</FormLabel>
                            <FormControl>
                                <Input placeholder="Es: Corso Sicurezza Generale" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="duration_hours"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Durata (Ore)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="validity_months"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Validità (Mesi)</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        placeholder="Opzionale"
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleziona categoria" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="safety">Sicurezza</SelectItem>
                                    <SelectItem value="quality">Qualità</SelectItem>
                                    <SelectItem value="technical">Tecnico</SelectItem>
                                    <SelectItem value="other">Altro</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {loading ? "Creazione..." : "Crea Corso"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
