import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "./template-editor";

export default async function EditTemplatePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // 1. Recuperiamo l'ID in modo asincrono (obbligatorio in Next.js 15)
  const { id } = await params;
  const supabase = await createClient();

  // 2. Proviamo a recuperare il template
  const { data: template, error } = await supabase
    .from("checklist_templates")
    .select("*, template_questions(*)")
    .eq("id", id)
    .single();

  // 3. Se c'è un errore o non trova dati, mostriamo il dettaglio invece del 404
  if (error || !template) {
    return (
      <div className="p-6 border-2 border-red-200 bg-red-50 rounded-lg">
        <h2 className="text-red-700 font-bold">Errore di Caricamento</h2>
        <p className="text-sm text-red-600">ID cercato: {id}</p>
        {error && <pre className="mt-2 p-2 bg-white text-xs text-red-500">{JSON.stringify(error, null, 2)}</pre>}
        {!template && !error && <p className="text-sm text-red-600 mt-2">Il record esiste nel DB ma Supabase non lo restituisce (probabile problema di permessi RLS).</p>}
        <a href="/templates" className="inline-block mt-4 text-sm font-medium text-red-700 underline">Torna alla lista</a>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Modifica Template: <span className="text-blue-600">{template.title}</span>
        </h1>
      </div>
      <TemplateEditor template={template} />
    </div>
  );
}