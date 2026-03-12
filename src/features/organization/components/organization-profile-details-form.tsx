"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
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
import { updateOrganizationProfileDetails } from "@/features/organization/actions/organization-console-actions";
import {
  organizationProfileDetailsSchema,
  type OrganizationProfileDetailsInput,
  type OrganizationProfileDetailsValues,
} from "@/features/organization/schemas/organization-console-schema";

export function OrganizationProfileDetailsForm({
  canManage,
  initialValues,
}: {
  canManage: boolean;
  initialValues: OrganizationProfileDetailsValues;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<OrganizationProfileDetailsInput, unknown, OrganizationProfileDetailsValues>({
    resolver: zodResolver(organizationProfileDetailsSchema),
    defaultValues: initialValues,
  });

  function onSubmit(values: OrganizationProfileDetailsValues) {
    startTransition(async () => {
      const result = await updateOrganizationProfileDetails(values);

      if (result.error) {
        toast.error("Profilo operativo non aggiornato", { description: result.error });
        return;
      }

      toast.success("Profilo operativo aggiornato", { description: result.success });
    });
  }

  return (
    <Card className="border-zinc-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Profilo operativo</CardTitle>
        <CardDescription>
          Contatti, referente qualita e testi base riusati in report e documenti.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="officialEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email ufficiale</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canManage || isPending} placeholder="info@azienda.it" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="officialPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefono ufficiale</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canManage || isPending} placeholder="+39 ..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualityLeadName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsabile qualita</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canManage || isPending} placeholder="Nome e cognome" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="qualityLeadEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email responsabile qualita</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canManage || isPending} placeholder="qualita@azienda.it" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="legalAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Indirizzo sede legale</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={!canManage || isPending} placeholder="Via..., CAP, Citta, Provincia" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="reportHeader"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Header report</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canManage || isPending} placeholder="Intestazione breve report" />
                    </FormControl>
                    <FormDescription>Testo sintetico in testata export/report.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reportFooter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer report</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!canManage || isPending} placeholder="Footer standard" />
                    </FormControl>
                    <FormDescription>Testo breve riusabile come chiusura standard.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end">
              <Button disabled={!canManage || isPending} type="submit">
                {isPending ? "Salvo..." : "Salva profilo operativo"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
