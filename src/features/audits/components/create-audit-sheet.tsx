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

type Client = {
  id: string;
  name: string;
};

type Location = {
  id: string;
  name: string;
  client_id: string;
};

const formSchema = z.object({
  title: z.string().min(2, "Title is required"),
  scheduled_date: z.string().min(1, "Date is required"),
  templateId: z.string().min(1, "Please select a template"),
  client_id: z.string().min(1, "Please select a client"),
  location_id: z.string().min(1, "Please select a location"),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateAuditSheet() {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      scheduled_date: new Date().toISOString().split("T")[0],
      templateId: "",
      client_id: "",
      location_id: "",
    },
  });

  useEffect(() => {
    if (!open) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch templates
        const { data: templatesData, error: templatesError } = await supabase
          .from("checklist_templates")
          .select("id, title")
          .order("title");

        if (templatesData) setTemplates(templatesData);
        if (templatesError) toast.error("Failed to load templates.");

        // Fetch clients
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, name")
          .order("name");

        if (clientsData) setClients(clientsData);
        if (clientsError) toast.error("Failed to load clients.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [open, supabase]);

  // When client is selected, fetch its locations
  useEffect(() => {
    if (!selectedClientId) {
      setLocations([]);
      form.setValue("location_id", "");
      return;
    }

    async function fetchLocations() {
      const { data, error } = await supabase
        .from("locations")
        .select("id, name, client_id")
        .eq("client_id", selectedClientId)
        .order("name");

      if (data) setLocations(data);
      if (error) toast.error("Failed to load locations.");
    }

    fetchLocations();
  }, [selectedClientId, supabase, form]);

  async function onSubmit(values: FormValues) {
    setIsLoading(true);
    try {
      const result = await createAuditFromTemplate({
        title: values.title,
        scheduled_date: values.scheduled_date,
        templateId: values.templateId,
        client_id: values.client_id,
        location_id: values.location_id,
      });

      if (result.success) {
        toast.success("Audit created successfully.");
        setOpen(false);
        form.reset();
        router.push(`/audits/${result.auditId}`);
      } else {
        toast.error(result.error || "Failed to create audit.");
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
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedClientId(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-white border-zinc-200">
                        <SelectValue placeholder={isLoading ? "Loading..." : "Select a client..."} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="z-[100] max-h-[200px]">
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="cursor-pointer">
                          {c.name}
                        </SelectItem>
                      ))}
                      {clients.length === 0 && !isLoading && (
                        <div className="px-2 py-4 text-sm text-center text-zinc-400">
                          No clients found. Create one first.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!selectedClientId}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full bg-white border-zinc-200">
                        <SelectValue placeholder={!selectedClientId ? "Select client first" : "Select a location..."} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent position="popper" className="z-[100] max-h-[200px]">
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id} className="cursor-pointer">
                          {loc.name}
                        </SelectItem>
                      ))}
                      {locations.length === 0 && selectedClientId && (
                        <div className="px-2 py-4 text-sm text-center text-zinc-400">
                          No locations found for this client.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
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
