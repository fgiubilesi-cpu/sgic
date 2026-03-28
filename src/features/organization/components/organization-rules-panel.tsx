"use client";

import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrganizationRules } from "@/features/organization/actions/organization-console-actions";
import {
  organizationRulesSchema,
  type OrganizationRulesInput,
  type OrganizationRulesValues,
} from "@/features/organization/schemas/organization-console-schema";

const SORT_OPTIONS = [
  { value: "scheduled_desc", label: "Newest first" },
  { value: "scheduled_asc", label: "Oldest first" },
  { value: "score_desc", label: "Highest score" },
  { value: "score_asc", label: "Lowest score" },
  { value: "nc_desc", label: "Most NC" },
  { value: "title_asc", label: "Title A-Z" },
] as const;

const GROUP_OPTIONS = [
  { value: "none", label: "No grouping" },
  { value: "month", label: "Month" },
  { value: "client", label: "Client" },
  { value: "location", label: "Location" },
  { value: "status", label: "Status" },
] as const;

export function OrganizationRulesPanel({
  canManage,
  initialValues,
}: {
  canManage: boolean;
  initialValues: OrganizationRulesValues;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<OrganizationRulesInput, unknown, OrganizationRulesValues>({
    resolver: zodResolver(organizationRulesSchema),
    defaultValues: initialValues,
  });

function onSubmit(values: OrganizationRulesValues) {
    startTransition(async () => {
      const result = await updateOrganizationRules(values);

      if (result.error) {
        toast.error("Regole non aggiornate", { description: result.error });
        return;
      }

      toast.success("Regole aggiornate", { description: result.success });
    });
  }

  const current = useWatch({ control: form.control });
  const getNumericValue = (value: unknown) => (typeof value === "number" ? value : "");
  const getNumericDisplay = (value: unknown) => {
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim() !== "") return value;
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Regole operative</CardTitle>
            <CardDescription>
              Parametri tenant-level che governano dashboard, alert e default dell&apos;audit explorer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="scoreWarningThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soglia warning score</FormLabel>
                        <FormControl>
                          <Input
                            disabled={!canManage || isPending}
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={(event) => field.onChange(event.target.value)}
                            ref={field.ref}
                            type="number"
                            value={getNumericValue(field.value)}
                          />
                        </FormControl>
                        <FormDescription>Score sotto questa soglia passa in fascia attenzione.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="scoreHealthyThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Soglia healthy score</FormLabel>
                        <FormControl>
                          <Input
                            disabled={!canManage || isPending}
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={(event) => field.onChange(event.target.value)}
                            ref={field.ref}
                            type="number"
                            value={getNumericValue(field.value)}
                          />
                        </FormControl>
                        <FormDescription>Score da questa soglia in su e considerato solido.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="auditAlertDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Finestra alert audit</FormLabel>
                        <FormControl>
                          <Input
                            disabled={!canManage || isPending}
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={(event) => field.onChange(event.target.value)}
                            ref={field.ref}
                            type="number"
                            value={getNumericValue(field.value)}
                          />
                        </FormControl>
                        <FormDescription>Numero giorni usati per “audit in scadenza”.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="documentAlertDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Finestra alert documenti</FormLabel>
                        <FormControl>
                          <Input
                            disabled={!canManage || isPending}
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={(event) => field.onChange(event.target.value)}
                            ref={field.ref}
                            type="number"
                            value={getNumericValue(field.value)}
                          />
                        </FormControl>
                        <FormDescription>Numero giorni usati per documenti in scadenza.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="trainingAlertDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Finestra alert formazione</FormLabel>
                        <FormControl>
                          <Input
                            disabled={!canManage || isPending}
                            name={field.name}
                            onBlur={field.onBlur}
                            onChange={(event) => field.onChange(event.target.value)}
                            ref={field.ref}
                            type="number"
                            value={getNumericValue(field.value)}
                          />
                        </FormControl>
                        <FormDescription>Numero giorni usati per formazione in scadenza.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultAuditView"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vista audit di default</FormLabel>
                        <Select disabled={!canManage || isPending} onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Vista" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="table">Table</SelectItem>
                            <SelectItem value="cards">Cards</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultAuditSort"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort audit di default</FormLabel>
                        <Select disabled={!canManage || isPending} onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SORT_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="defaultAuditGroupBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grouping audit di default</FormLabel>
                        <Select disabled={!canManage || isPending} onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Grouping" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GROUP_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end">
                  <Button disabled={!canManage || isPending} type="submit">
                    {isPending ? "Salvo..." : "Salva regole"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Preview regole</CardTitle>
            <CardDescription>
              Lettura sintetica delle regole operative oggi attive per il tenant.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-600">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              Score healthy da <span className="font-semibold text-zinc-900">{getNumericDisplay(current.scoreHealthyThreshold)}%</span>,
              warning sotto <span className="font-semibold text-zinc-900">{getNumericDisplay(current.scoreWarningThreshold)}%</span>.
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              Alert audit: <span className="font-semibold text-zinc-900">{getNumericDisplay(current.auditAlertDays)} giorni</span>.
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              Default audit explorer: <span className="font-semibold text-zinc-900">{current.defaultAuditView}</span> /{" "}
              <span className="font-semibold text-zinc-900">{current.defaultAuditSort}</span> /{" "}
              <span className="font-semibold text-zinc-900">{current.defaultAuditGroupBy}</span>.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
