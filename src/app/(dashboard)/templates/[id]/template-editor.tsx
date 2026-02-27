"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  addTemplateQuestion,
  softDeleteTemplateQuestion,
} from "@/features/audits/actions";

type Question = {
  id: string;
  question: string;
};

type TemplateEditorProps = {
  templateId: string;
  initialQuestions: Question[];
};

export function TemplateEditor({
  templateId,
  initialQuestions,
}: TemplateEditorProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [newQuestion, setNewQuestion] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddQuestion = () => {
    const text = newQuestion.trim();
    if (!text) return;

    startTransition(async () => {
      const result = await addTemplateQuestion(templateId, text);
      if (result.success) {
        setQuestions((prev) => [...prev, result.question]);
        setNewQuestion("");
        toast.success("Question added");
      } else {
        toast.error("Failed to add question", { description: result.error });
      }
    });
  };

  const handleDeleteQuestion = (questionId: string) => {
    startTransition(async () => {
      const result = await softDeleteTemplateQuestion(questionId, templateId);
      if (result.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
        toast.success("Question removed");
      } else {
        toast.error("Failed to remove question", { description: result.error });
      }
    });
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex gap-2">
        <Input
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Type a new question..."
          onKeyDown={(e) =>
            e.key === "Enter" && !isPending && handleAddQuestion()
          }
          disabled={isPending}
        />
        <Button
          onClick={handleAddQuestion}
          disabled={isPending || !newQuestion.trim()}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Add
        </Button>
      </div>

      <div className="bg-white border rounded-lg divide-y shadow-sm">
        {questions.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500 italic">
            No questions in this template yet. Add one above to get started.
          </p>
        )}
        {questions.map((q) => (
          <div
            key={q.id}
            className="p-4 flex justify-between items-center text-sm group hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium text-slate-700">{q.question}</span>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-300 hover:text-red-600 transition-colors"
              onClick={() => handleDeleteQuestion(q.id)}
              disabled={isPending}
              aria-label="Remove question"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
