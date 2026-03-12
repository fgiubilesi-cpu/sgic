import { TemplateEditorForm } from "@/features/audits/components/template-editor-form";

export default function NewTemplatePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col space-y-6 py-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Nuovo template audit</h1>
        <p className="text-sm text-zinc-500">
          Crea un modello riusabile e prepara subito le domande che dovranno popolare gli audit.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <TemplateEditorForm submitLabel="Crea template" />
      </div>
    </div>
  );
}
