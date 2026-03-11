"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TrainingRecordForm } from "./training-record-form";
import type { Tables } from "@/types/database.types";

type RegisterTrainingSheetProps = {
    personnel: Tables<"personnel">[];
    courses: Tables<"training_courses">[];
    defaultPersonnelId?: string;
    triggerLabel?: string;
};

export function RegisterTrainingSheet({
    personnel,
    courses,
    defaultPersonnelId,
    triggerLabel,
}: RegisterTrainingSheetProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {triggerLabel ?? "Registra Formazione"}
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Registra Completamento Corso</SheetTitle>
                    <SheetDescription>
                        Associa un dipendente a un corso completato.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                    <TrainingRecordForm
                        personnel={personnel}
                        courses={courses}
                        defaultPersonnelId={defaultPersonnelId}
                        onSuccess={() => setOpen(false)}
                    />
                </div>
            </SheetContent>
        </Sheet>
    );
}
