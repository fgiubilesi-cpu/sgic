"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  canManage?: boolean;
  organization: Organization;
};

export function OrgSettingsForm({ canManage = true, organization }: OrgSettingsFormProps) {
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
        toast.error("Aggiornamento organizzazione non riuscito", {
          description: result.error,
        });
        return;
      }

      toast.success("Organizzazione aggiornata", {
        description: result.success ?? "Modifiche salvate correttamente.",
      });
    });
  };

  return (
    <Card className="max-w-2xl border-zinc-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Anagrafica organizzazione
        </CardTitle>
        <CardDescription className="text-sm text-zinc-500">
          Aggiorna i dati base dell&apos;organizzazione. Queste informazioni vengono usate
          in report audit, intestazioni e documentazione ISO 9001.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ragione sociale</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Es. Giubilesi Associati"
                      autoComplete="organization"
                      disabled={!canManage || isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Nome legale dell&apos;organizzazione, come apparira nei documenti.
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
                      placeholder="Es. IT12345678900"
                      inputMode="numeric"
                      disabled={!canManage || isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Facoltativa. Usata per intestazioni fiscali e documentali.
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
                      placeholder="Es. giubilesi-associati"
                      autoCapitalize="none"
                      autoCorrect="off"
                      disabled={!canManage || isPending}
                    />
                  </FormControl>
                  <FormDescription>
                    Identificatore univoco usato negli URL (es. domain/org/
                    <span className="font-mono text-xs">giubilesi-associati</span>). Deve essere univoco.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={!canManage || isPending}>
                {isPending ? "Salvataggio..." : "Salva anagrafica"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
