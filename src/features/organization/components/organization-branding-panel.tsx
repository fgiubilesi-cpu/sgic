"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateOrganizationBranding } from "@/features/organization/actions/organization-console-actions";
import {
  organizationBrandingSchema,
  type OrganizationBrandingInput,
  type OrganizationBrandingValues,
} from "@/features/organization/schemas/organization-console-schema";

export function OrganizationBrandingPanel({
  canManage,
  initialValues,
}: {
  canManage: boolean;
  initialValues: OrganizationBrandingValues;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<OrganizationBrandingInput, unknown, OrganizationBrandingValues>({
    resolver: zodResolver(organizationBrandingSchema),
    defaultValues: initialValues,
  });

  function onSubmit(values: OrganizationBrandingValues) {
    startTransition(async () => {
      const result = await updateOrganizationBranding(values);

      if (result.error) {
        toast.error("Branding non aggiornato", { description: result.error });
        return;
      }

      toast.success("Branding aggiornato", { description: result.success });
    });
  }

  const current = useWatch({ control: form.control });

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Branding e output</CardTitle>
          <CardDescription>
            Governa come il tenant si presenta nei report e negli output amministrativi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="reportTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titolo report</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canManage || isPending} placeholder="SGIC Report" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reportSubtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sottotitolo report</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canManage || isPending} placeholder="ISO 9001 Audit Suite" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canManage || isPending} placeholder="https://..." />
                      </FormControl>
                      <FormDescription>URL del logo usato nei report o nella testata tenant.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colore primario</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canManage || isPending} placeholder="#18181b" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="emailSignature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Firma email standard</FormLabel>
                    <FormControl>
                      <Textarea {...field} disabled={!canManage || isPending} placeholder="Firma standard per reminder e comunicazioni..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button disabled={!canManage || isPending} type="submit">
                  {isPending ? "Salvo..." : "Salva branding"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Preview output</CardTitle>
          <CardDescription>
            Anteprima semplificata di come il tenant si presentera nei report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">{current.reportSubtitle || "Subtitle"}</p>
                <h3 className="mt-2 text-xl font-semibold text-zinc-900">{current.reportTitle}</h3>
              </div>
              <div
                className="h-12 w-12 rounded-2xl border border-zinc-200"
                style={{ backgroundColor: current.primaryColor }}
              />
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-600">
              {current.logoUrl ? (
                <p className="break-all text-xs text-zinc-500">Logo: {current.logoUrl}</p>
              ) : (
                <p className="text-xs text-zinc-400">Nessun logo configurato</p>
              )}
              <p className="mt-3">{current.emailSignature || "Firma email standard non ancora impostata."}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
