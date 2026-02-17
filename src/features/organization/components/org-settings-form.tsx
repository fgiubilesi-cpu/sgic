"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import {
  organizationUpdateSchema,
  type OrganizationUpdateInput,
} from "@/features/organization/schemas/organization-schema";
import type { Organization } from "@/features/organization/queries/get-organization";
import { updateOrganization } from "@/features/organization/actions/org-actions";

type OrgSettingsFormProps = {
  organization: Organization;
};

export function OrgSettingsForm({ organization }: OrgSettingsFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<OrganizationUpdateInput>({
    resolver: zodResolver(organizationUpdateSchema),
    defaultValues: {
      name: organization.name ?? "",
      vat_number: organization.vat_number ?? "",
      slug: organization.slug ?? "",
    },
  });

  const onSubmit = (values: OrganizationUpdateInput) => {
    startTransition(async () => {
      const result = await updateOrganization(values);

      if (result.error) {
        toast.error("Errore aggiornamento organizzazione", {
          description: result.error,
        });
        return;
      }

      toast.success("Organizzazione aggiornata", {
        description: result.success ?? "I dati sono stati salvati correttamente.",
      });
    });
  };

  return (
    <Card className="max-w-2xl border-zinc-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Impostazioni organizzazione
        </CardTitle>
        <CardDescription className="text-sm text-zinc-500">
          Aggiorna le informazioni principali della tua organizzazione. Questi dati
          verranno utilizzati nei report e nei documenti di audit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome azienda</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Es. ACME S.p.A."
                      autoComplete="organization"
                    />
                  </FormControl>
                  <FormDescription>
                    Nome legale dell&apos;organizzazione come apparirà nei documenti.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vat_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Partita IVA</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Es. 01234567890"
                      inputMode="numeric"
                    />
                  </FormControl>
                  <FormDescription>
                    Campo opzionale. Utilizzato per le intestazioni fiscali e di fatturazione.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="es. acme-audit"
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                  </FormControl>
                  <FormDescription>
                    Identificativo univoco utilizzato negli URL (es. dominio/organization/
                    <span className="font-mono text-xs">acme-audit</span>). Deve essere unico.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="submit"
                disabled={isPending}
              >
                {isPending ? "Salvataggio in corso..." : "Salva modifiche"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

