"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Plus, Trash2, Stethoscope } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { medicalVisitSchema } from "../schemas/medical-visit-schema";
import type { MedicalVisitFormInput } from "../schemas/medical-visit-schema";
import { createMedicalVisit, deleteMedicalVisit } from "../actions/medical-visit-actions";
import type { Tables } from "@/types/database.types";

type MedicalVisitRow = Tables<"medical_visits">;

interface MedicalVisitsCardProps {
  personnelId: string;
  visits: MedicalVisitRow[];
}

const FITNESS_LABELS: Record<string, string> = {
  fit: "Idoneo",
  fit_with_limitations: "Idoneo con limitazioni",
  unfit: "Non idoneo",
  pending: "In attesa",
};

function fitnessTone(status: string) {
  if (status === "fit") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "fit_with_limitations") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "unfit") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}

function expiryTone(expiryDate: string | null) {
  if (!expiryDate) return "";
  const exp = new Date(expiryDate);
  const today = new Date();
  const in30 = new Date();
  in30.setDate(today.getDate() + 30);
  if (exp < today) return "text-rose-600 font-medium";
  if (exp <= in30) return "text-amber-600 font-medium";
  return "text-emerald-600";
}

export function MedicalVisitsCard({ personnelId, visits }: MedicalVisitsCardProps) {
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const form = useForm<MedicalVisitFormInput>({
    resolver: zodResolver(medicalVisitSchema),
    defaultValues: {
      visit_date: new Date().toISOString().split("T")[0],
      expiry_date: "",
      fitness_status: "fit",
      limitations: "",
      doctor_name: "",
      protocol: "",
      notes: "",
    },
  });

  const onSubmit = async (values: MedicalVisitFormInput) => {
    const result = await createMedicalVisit(personnelId, values);
    if (result.success) {
      toast.success("Visita medica registrata.");
      setShowForm(false);
      form.reset();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (visitId: string) => {
    if (!confirm("Eliminare questa visita medica?")) return;
    setDeletingId(visitId);
    const result = await deleteMedicalVisit(visitId, personnelId);
    if (result.success) {
      toast.success("Visita eliminata.");
    } else {
      toast.error(result.error);
    }
    setDeletingId(null);
  };

  const latestVisit = visits[0] ?? null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">Visite Mediche</CardTitle>
          <CardDescription>
            Storico visite, idoneità e scadenze sorveglianza sanitaria.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-3.5 w-3.5" />
            Nuova visita
          </Button>
          <Stethoscope className="h-5 w-5 text-zinc-400" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick summary */}
        {latestVisit && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border px-3 py-2">
              <div className="text-xs text-zinc-500">Ultima visita</div>
              <div className="text-sm font-medium">
                {format(new Date(latestVisit.visit_date), "dd MMM yyyy", { locale: it })}
              </div>
            </div>
            <div className="rounded-lg border px-3 py-2">
              <div className="text-xs text-zinc-500">Idoneità</div>
              <Badge variant="outline" className={fitnessTone(latestVisit.fitness_status)}>
                {FITNESS_LABELS[latestVisit.fitness_status] ?? latestVisit.fitness_status}
              </Badge>
            </div>
            <div className="rounded-lg border px-3 py-2">
              <div className="text-xs text-zinc-500">Scadenza</div>
              <div className={`text-sm font-medium ${expiryTone(latestVisit.expiry_date)}`}>
                {latestVisit.expiry_date
                  ? format(new Date(latestVisit.expiry_date), "dd MMM yyyy", { locale: it })
                  : "Non definita"}
              </div>
            </div>
            <div className="rounded-lg border px-3 py-2">
              <div className="text-xs text-zinc-500">Medico</div>
              <div className="text-sm font-medium truncate">
                {latestVisit.doctor_name ?? "-"}
              </div>
            </div>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="visit_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Data visita *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expiry_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Scadenza</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fitness_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Idoneità</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="text-xs">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fit">Idoneo</SelectItem>
                            <SelectItem value="fit_with_limitations">Con limitazioni</SelectItem>
                            <SelectItem value="unfit">Non idoneo</SelectItem>
                            <SelectItem value="pending">In attesa</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="doctor_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Medico</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Rossi" {...field} value={field.value ?? ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="protocol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Protocollo</FormLabel>
                        <FormControl>
                          <Input placeholder="es. Alimentaristi" {...field} value={field.value ?? ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="limitations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Limitazioni</FormLabel>
                        <FormControl>
                          <Input placeholder="Se presenti..." {...field} value={field.value ?? ""} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Note</FormLabel>
                      <FormControl>
                        <Input placeholder="Note aggiuntive..." {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Salvo..." : "Salva visita"}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                    Annulla
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {/* Table */}
        {visits.length === 0 && !showForm ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-8 text-center">
            <Stethoscope className="mx-auto h-8 w-8 text-zinc-300" />
            <p className="mt-2 text-sm font-medium text-zinc-700">Nessuna visita medica registrata</p>
            <p className="mt-1 text-xs text-zinc-500">
              Aggiungi la prima visita medica per questo collaboratore.
            </p>
          </div>
        ) : visits.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Idoneità</TableHead>
                <TableHead>Scadenza</TableHead>
                <TableHead>Medico</TableHead>
                <TableHead>Protocollo</TableHead>
                <TableHead>Note</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="text-sm">
                    {format(new Date(visit.visit_date), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={fitnessTone(visit.fitness_status)}>
                      {FITNESS_LABELS[visit.fitness_status] ?? visit.fitness_status}
                    </Badge>
                    {visit.limitations && (
                      <p className="mt-1 text-xs text-zinc-500 max-w-[150px] truncate">
                        {visit.limitations}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className={`text-sm ${expiryTone(visit.expiry_date)}`}>
                    {visit.expiry_date
                      ? format(new Date(visit.expiry_date), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">{visit.doctor_name ?? "-"}</TableCell>
                  <TableCell className="text-sm">{visit.protocol ?? "-"}</TableCell>
                  <TableCell className="text-sm text-zinc-500 max-w-[150px] truncate">
                    {visit.notes ?? "-"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-rose-600"
                      disabled={deletingId === visit.id}
                      onClick={() => handleDelete(visit.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}
