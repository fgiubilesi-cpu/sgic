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
import { TrainingCourseForm } from "./training-course-form";

export function CreateCourseSheet() {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo Corso
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Nuovo Corso di Formazione</SheetTitle>
                    <SheetDescription>
                        Aggiungi un nuovo corso al catalogo aziendale.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6">
                    <TrainingCourseForm onSuccess={() => setOpen(false)} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
