import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CloneTemplateSheet } from "@/features/audits/components/clone-template-sheet";
import { TemplateEditorForm } from "@/features/audits/components/template-editor-form";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from("checklist_templates")
    .select("id, title, description, template_questions(id, question, sort_order, deleted_at)")
    .eq("id", id)
    .single();

  if (error || !template) {
    notFound();
  }

  // Filter out soft-deleted questions and normalise types
  const questions = (
    (template.template_questions as Array<{
      id: string | number;
      question: string | null;
      sort_order: number | null;
      deleted_at: string | null;
    }>) ?? []
  )
    .filter((q) => q.deleted_at == null)
    .sort((left, right) => (left.sort_order ?? 0) - (right.sort_order ?? 0))
    .map((q, index) => ({
      id: String(q.id),
      question: q.question ?? "",
      sortOrder: q.sort_order ?? index + 1,
    }));

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Template:{" "}
          <span className="text-blue-600">
            {(template as { title?: string | null }).title}
          </span>
        </h1>
        <CloneTemplateSheet templateId={String(template.id)} />
      </div>
      <TemplateEditorForm
        templateId={String(template.id)}
        initialTitle={(template as { title?: string | null }).title ?? ""}
        initialDescription={(template as { description?: string | null }).description ?? ""}
        initialQuestions={questions}
        submitLabel="Salva template"
      />
    </div>
  );
}
