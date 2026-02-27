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
        toast.error("Failed to update organisation", {
          description: result.error,
        });
        return;
      }

      toast.success("Organisation updated", {
        description: result.success ?? "Changes saved successfully.",
      });
    });
  };

  return (
    <Card className="max-w-2xl border-zinc-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Organisation Settings
        </CardTitle>
        <CardDescription className="text-sm text-zinc-500">
          Update your organisation&apos;s core information. This data is used in
          audit reports and ISO 9001 documentation.
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
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. ACME Ltd."
                      autoComplete="organization"
                    />
                  </FormControl>
                  <FormDescription>
                    Legal name of the organisation as it will appear in documents.
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
                  <FormLabel>VAT Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. GB123456789"
                      inputMode="numeric"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional. Used for invoicing and fiscal headers.
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
                      placeholder="e.g. acme-audit"
                      autoCapitalize="none"
                      autoCorrect="off"
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier used in URLs (e.g. domain/org/
                    <span className="font-mono text-xs">acme-audit</span>). Must be unique.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
