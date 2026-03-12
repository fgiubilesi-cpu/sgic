import Link from "next/link";
import { Layout, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ImportTemplateSheet } from "@/features/audits/components/import-template-sheet";
import { getAllTemplates } from "@/features/audits/queries/get-templates";

export default async function TemplatesPage() {
  const templates = await getAllTemplates();

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Libreria template audit</h1>
          <p className="text-muted-foreground">
            Crea, importa e mantieni i modelli checklist usati per generare nuovi audit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ImportTemplateSheet
            templates={templates.map((template) => ({
              id: template.id,
              title: template.title,
            }))}
          />
          <Button asChild>
            <Link href="/templates/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuovo template
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="border-zinc-200 bg-white shadow-sm transition hover:border-zinc-300">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                <Layout className="h-4 w-4 text-zinc-400" />
                Template
              </div>

              <div className="space-y-2">
                <CardTitle className="text-lg text-zinc-900">{template.title}</CardTitle>
                <CardDescription>
                  {template.description ?? "Nessuna descrizione disponibile."}
                </CardDescription>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700">
                  {template.questionCount} domande
                </span>
                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600">
                  {template.clientName ? `Cliente: ${template.clientName}` : "Globale"}
                </span>
              </div>
            </CardHeader>

            <CardContent className="flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-500">
                Apri il template per modificare domande, descrizione o clonarlo.
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/templates/${template.id}`}>Apri</Link>
              </Button>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 ? (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 px-6 py-14 text-center text-sm text-zinc-500">
            Nessun template disponibile. Crea il primo oppure importa una checklist Excel.
          </div>
        ) : null}
      </div>
    </div>
  );
}
