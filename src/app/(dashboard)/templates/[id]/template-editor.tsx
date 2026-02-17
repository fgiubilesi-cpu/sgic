"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function TemplateEditor({ template }: any) {
  const [questions, setQuestions] = useState(template.template_questions || []);
  const [newQuestion, setNewQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const addQuestion = async () => {
    if (!newQuestion) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("template_questions")
      .insert({ template_id: template.id, question: newQuestion })
      .select().single();
    
    if (!error) {
      setQuestions([...questions, data]);
      setNewQuestion("");
      toast.success("Domanda aggiunta");
    }
    setLoading(false);
  };

  const deleteQuestion = async (id: string) => {
    const { error } = await supabase
      .from("template_questions")
      .delete()
      .eq("id", id);
    
    if (!error) {
      setQuestions(questions.filter((q: any) => q.id !== id));
      toast.success("Domanda rimossa");
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex gap-2">
        <Input 
          value={newQuestion} 
          onChange={(e) => setNewQuestion(e.target.value)} 
          placeholder="Scrivi una nuova domanda..." 
          onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
        />
        <Button onClick={addQuestion} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />} 
          Aggiungi
        </Button>
      </div>
      
      <div className="bg-white border rounded-lg divide-y shadow-sm">
        {questions.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500 italic">
            Nessuna domanda in questo template. Comincia a scriverne una sopra!
          </p>
        )}
        {questions.map((q: any) => (
          <div key={q.id} className="p-4 flex justify-between items-center text-sm group hover:bg-slate-50 transition-colors">
            <span className="font-medium text-slate-700">{q.question}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-slate-300 hover:text-red-600 transition-colors"
              onClick={() => deleteQuestion(q.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}