import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Layout } from "lucide-react";
import Link from "next/link";

export default async function TemplatesPage() {
  const supabase = await createClient();

  const { data: templates } = await supabase
    .from("checklist_templates")
    .select("*, template_questions(count)")
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Checklist Templates</h1>
          <p className="text-muted-foreground">
            Manage reusable templates to use when creating new audits.
          </p>
        </div>
        <Button asChild>
          <Link href="/templates/new">
            <Plus className="mr-2 h-4 w-4" /> New Template
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates?.map((t) => (
          <Card
            key={t.id}
            className="hover:border-blue-400 transition-colors cursor-pointer group"
          >
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Layout className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                  Template
                </span>
              </div>
              <CardTitle className="text-lg">{t.title}</CardTitle>
              <CardDescription>
                {t.description ?? "No description"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  Questions: {t.template_questions?.[0]?.count ?? 0}
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/templates/${t.id}`}>Edit</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!templates?.length && (
          <div className="col-span-full py-12 border-2 border-dashed rounded-lg text-center text-muted-foreground">
            No templates yet. Start by creating one.
          </div>
        )}
      </div>
    </div>
  );
}
