"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import type { Control } from "react-hook-form";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateOrganizationNotifications } from "@/features/organization/actions/organization-console-actions";
import {
  organizationNotificationsSchema,
  type OrganizationNotificationsInput,
  type OrganizationNotificationsValues,
} from "@/features/organization/schemas/organization-console-schema";

type ToggleFieldProps = {
  control: Control<OrganizationNotificationsInput, unknown, OrganizationNotificationsValues>;
  description: string;
  disabled: boolean;
  label: string;
  name: keyof OrganizationNotificationsValues;
};

function ToggleField({ control, description, disabled, label, name }: ToggleFieldProps) {
  return (
    <FormField
      control={control}
      name={name as never}
      render={({ field }) => (
        <FormItem className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <FormLabel>{label}</FormLabel>
              <FormDescription>{description}</FormDescription>
            </div>
            <FormControl>
              <input
                checked={field.value}
                className="mt-1 h-4 w-4 rounded border-zinc-300"
                disabled={disabled}
                onChange={(event) => field.onChange(event.target.checked)}
                type="checkbox"
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function OrganizationNotificationsPanel({
  canManage,
  initialValues,
}: {
  canManage: boolean;
  initialValues: OrganizationNotificationsValues;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<OrganizationNotificationsInput, unknown, OrganizationNotificationsValues>({
    resolver: zodResolver(organizationNotificationsSchema),
    defaultValues: initialValues,
  });

  function onSubmit(values: OrganizationNotificationsValues) {
    startTransition(async () => {
      const result = await updateOrganizationNotifications(values);

      if (result.error) {
        toast.error("Notifiche non aggiornate", { description: result.error });
        return;
      }

      toast.success("Notifiche aggiornate", { description: result.success });
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Notifiche tenant</CardTitle>
          <CardDescription>
            Decidi quali alert il sistema deve far emergere e con quale frequenza sintetica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience</FormLabel>
                      <Select disabled={!canManage || isPending} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Audience" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="admins_inspectors">Admin + inspector</SelectItem>
                          <SelectItem value="admins">Solo admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Chi deve vedere e presidiare il centro notifiche.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="deliveryChannel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canale</FormLabel>
                      <Select disabled={!canManage || isPending} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Canale" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dashboard_email">Dashboard + email</SelectItem>
                          <SelectItem value="dashboard">Solo dashboard</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Livello minimo di distribuzione per i trigger attivi.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="digestFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Digest frequenza</FormLabel>
                      <Select disabled={!canManage || isPending} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Frequenza" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="off">Off</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minimumSeverity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severita minima</FormLabel>
                      <Select disabled={!canManage || isPending} onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Severita" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="default">Tutto</SelectItem>
                          <SelectItem value="warning">Warning + danger</SelectItem>
                          <SelectItem value="danger">Solo danger</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>I trigger sotto soglia finiscono in &quot;silenziate&quot;.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recipients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destinatari digest</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!canManage || isPending} placeholder="mail1@..., mail2@..." />
                      </FormControl>
                      <FormDescription>Email separate da virgola.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ToggleField
                  control={form.control}
                  description="Avvisa quando un audit entra nella finestra di scadenza."
                  disabled={!canManage || isPending}
                  label="Audit upcoming"
                  name="sendAuditUpcoming"
                />
                <ToggleField
                  control={form.control}
                  description="Avvisa quando un audit e gia oltre la data prevista."
                  disabled={!canManage || isPending}
                  label="Audit overdue"
                  name="sendAuditOverdue"
                />
                <ToggleField
                  control={form.control}
                  description="Segnala la presenza di NC aperte nel tenant."
                  disabled={!canManage || isPending}
                  label="Non conformita aperte"
                  name="sendOpenNonConformities"
                />
                <ToggleField
                  control={form.control}
                  description="Segnala le azioni correttive che superano la target date."
                  disabled={!canManage || isPending}
                  label="Azioni correttive scadute"
                  name="sendOverdueActions"
                />
                <ToggleField
                  control={form.control}
                  description="Avvisa per documenti in scadenza o scaduti."
                  disabled={!canManage || isPending}
                  label="Documenti in scadenza"
                  name="sendDocumentExpiry"
                />
                <ToggleField
                  control={form.control}
                  description="Avvisa per formazione in scadenza o gia scaduta."
                  disabled={!canManage || isPending}
                  label="Formazione in scadenza"
                  name="sendTrainingExpiry"
                />
              </div>

              <div className="flex justify-end">
                <Button disabled={!canManage || isPending} type="submit">
                  {isPending ? "Salvo..." : "Salva notifiche"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="border-zinc-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Note operative</CardTitle>
          <CardDescription>
            Queste impostazioni governano la lettura amministrativa del tenant, non un motore email esterno dedicato.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-600">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            Le notifiche configurate qui influenzano la console admin e le viste di controllo del tenant.
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            Il Notification Center usa queste preferenze per distinguere trigger attivi, silenziati e storico invii.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
