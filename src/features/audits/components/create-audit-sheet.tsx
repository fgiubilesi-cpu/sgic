"use client";

import { useState, useEffect } from "react";
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

import { createAuditFromTemplate } from "@/features/audits/actions";
import { createClient } from "@/lib/supabase/client";

type Template = {
  id: string;
  title: string;
};

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  scheduled_date: z.string().min(1, "Date is required"),
  templateId: z.string().min(1, "Please select a template"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateAuditSheet() {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      scheduled_date: new Date().toISOString().split("T")[0],
      templateId: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    async function fetchTemplates() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("id, title")
        .order("title");

      if (data) setTemplates(data);
      if (error) toast.error("Failed to load templates.");
      setIsLoading(false);
    }

    fetchTemplates();
  }, [open, supabase]);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const result = await createAuditFromTemplate({
        title: values.title,
        scheduled_date: values.scheduled_date,
        templateId: values.templateId,
      });

      if (result.success) {
        toast.success("Audit created successfully.");
        setOpen(false);
        form.reset();
        router.push(`/audits/${result.auditId}`);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="bg-zinc-900 text-white gap-2">
          <Plus className="h-4 w-4" /> New Audit
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-[450px] pointer-events-auto">
        <SheetHeader className="text-left border-b pb-4">
          <SheetTitle className="text-xl">New Audit</SheetTitle>
          <SheetDescription>
            Configure the inspection starting from a template.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audit Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Q1 Quality Inspection" {...field} />
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
                  <FormLabel>Scheduled Date</FormLabel>
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
                  <FormLabel>Checklist Template</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-white border-zinc-200">
                        <SelectValue placeholder={isLoading ? "Loading..." : "Select a template..."} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="z-[100] max-h-[200px]">
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id} className="cursor-pointer">
                          {t.title}
                        </SelectItem>
                      ))}
                      {templates.length === 0 && !isLoading && (
                        <div className="px-2 py-4 text-sm text-center text-zinc-400">
                          No templates found. Create one first.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-11 bg-zinc-900"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Audit"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
