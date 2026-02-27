import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TemplateEditor } from "./template-editor";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: template, error } = await supabase
    .from("checklist_templates")
    .select("id, title, template_questions(id, question, deleted_at)")
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
      deleted_at: string | null;
    }>) ?? []
  )
    .filter((q) => q.deleted_at == null)
    .map((q) => ({ id: String(q.id), question: q.question ?? "" }));

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit Template:{" "}
          <span className="text-blue-600">
            {(template as { title?: string | null }).title}
          </span>
        </h1>
      </div>
      <TemplateEditor
        templateId={String(template.id)}
        initialQuestions={questions}
      />
    </div>
  );
}
