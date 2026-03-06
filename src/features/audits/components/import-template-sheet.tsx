'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { importTemplateQuestions } from '@/features/audits/actions/import-template-actions';
import { createClient } from '@/lib/supabase/client';

type Template = {
  id: string;
  title: string;
};

type ParsedQuestion = {
  sort_order: number;
  question: string;
};

export function ImportTemplateSheet() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    if (!open) return;

    async function fetchTemplates() {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('checklist_templates')
          .select('id, title')
          .order('title');

        if (data) setTemplates(data);
        if (error) toast.error('Failed to load templates.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplates();
  }, [open, supabase]);

  // Parse Excel file
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        toast.error('No data found in Excel file.');
        return;
      }

      // Parse rows: first column = sort order, second = question text
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (string | number)[][];

      if (rows.length === 0) {
        toast.error('No questions found in Excel file.');
        return;
      }

      const parsed: ParsedQuestion[] = rows
        .slice(1) // Skip header
        .map((row, index) => {
          const sortOrder = typeof row[0] === 'number' ? row[0] : index + 1;
          const question = String(row[1] || '').trim();
          return {
            sort_order: Number(sortOrder),
            question,
          };
        })
        .filter((q) => q.question.length > 0);

      if (parsed.length === 0) {
        toast.error('No valid questions found.');
        return;
      }

      setQuestions(parsed);
      toast.success(`${parsed.length} questions parsed.`);
    } catch (error) {
      console.error('Excel parse error:', error);
      toast.error('Failed to parse Excel file.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImport() {
    if (!templateId || questions.length === 0) {
      toast.error('Select a template and upload questions.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await importTemplateQuestions({
        templateId,
        questions,
      });

      if (result.success) {
        toast.success(`${questions.length} questions imported.`);
        setOpen(false);
        setQuestions([]);
        setTemplateId('');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import questions.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2" size="sm">
          <Upload className="h-4 w-4" /> Import from Excel
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-2xl pointer-events-auto max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left border-b pb-4">
          <SheetTitle className="text-xl">Import Template Questions</SheetTitle>
          <SheetDescription>
            Upload an Excel file with questions. First column: sort order, Second column: question text.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          {/* Template select */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Template</label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="w-full bg-white border-zinc-200">
                <SelectValue placeholder={isLoading ? 'Loading...' : 'Select a template...'} />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[100]">
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
                {templates.length === 0 && !isLoading && (
                  <div className="px-2 py-4 text-sm text-center text-zinc-400">
                    No templates found. Create one first.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Upload Excel File</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isLoading}
              className="block w-full text-sm text-zinc-600
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-zinc-50 file:text-zinc-700
                hover:file:bg-zinc-100
                disabled:opacity-50"
            />
          </div>

          {/* Preview table */}
          {questions.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview ({questions.length} questions)</label>
              <div className="rounded-lg border border-zinc-200 bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Order</TableHead>
                      <TableHead>Question</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((q, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="text-sm text-zinc-600">{q.sort_order}</TableCell>
                        <TableCell className="text-sm text-zinc-900">{q.question}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Import button */}
          <Button
            onClick={handleImport}
            disabled={isLoading || questions.length === 0}
            className="w-full h-11 bg-zinc-900"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import Questions'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
