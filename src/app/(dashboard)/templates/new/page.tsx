"use server";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const newTemplateSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(200),
  description: z.string().trim().max(500).optional(),
});

async function createTemplate(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (!profile?.organization_id) {
    throw new Error("No organisation linked to your profile.");
  }

  const parsed = newTemplateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    throw new Error("Invalid form data.");
  }

  const { data, error } = await supabase
    .from("checklist_templates")
    .insert({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      organization_id: profile.organization_id,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("Failed to create template.");
  }

  redirect(`/templates/${data.id}`);
}

export default async function NewTemplatePage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Create New Template</CardTitle>
          <CardDescription>
            Define a reusable checklist template. You can add questions after creating it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTemplate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Template Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Site Safety Inspection"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe the purpose of this checklist..."
              />
            </div>
            <div className="flex gap-4 pt-4">
              <Button type="submit">Create and continue</Button>
              <Button variant="ghost" type="button" asChild>
                <Link href="/templates">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
