'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createTemplate, saveTemplateDefinition } from '@/features/audits/actions/template-actions'

export type TemplateEditorQuestion = {
  id?: string
  question: string
  sortOrder: number
}

type TemplateEditorFormProps = {
  templateId?: string
  initialTitle?: string
  initialDescription?: string
  initialQuestions?: TemplateEditorQuestion[]
  submitLabel?: string
  onSaved?: (templateId: string) => void
  onCancel?: () => void
  cancelLabel?: string
}

function normalizeQuestions(questions: TemplateEditorQuestion[]) {
  return questions
    .map((question) => ({
      ...question,
      question: question.question.trim(),
    }))
    .filter((question) => question.question.length > 0)
    .map((question, index) => ({
      ...question,
      sortOrder: index + 1,
    }))
}

export function TemplateEditorForm({
  templateId,
  initialTitle = '',
  initialDescription = '',
  initialQuestions = [],
  submitLabel,
  onSaved,
  onCancel,
  cancelLabel = 'Annulla',
}: TemplateEditorFormProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [questions, setQuestions] = useState<TemplateEditorQuestion[]>(
    initialQuestions.length > 0 ? initialQuestions : [{ question: '', sortOrder: 1 }]
  )
  const [isPending, startTransition] = useTransition()

  const effectiveSubmitLabel =
    submitLabel ?? (templateId ? 'Salva modifiche' : 'Crea template')

  const handleAddQuestion = () => {
    setQuestions((currentQuestions) => [
      ...currentQuestions,
      {
        question: '',
        sortOrder: currentQuestions.length + 1,
      },
    ])
  }

  const handleUpdateQuestion = (index: number, value: string) => {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, question: value } : question
      )
    )
  }

  const handleDeleteQuestion = (index: number) => {
    setQuestions((currentQuestions) => {
      const nextQuestions = currentQuestions.filter((_, questionIndex) => questionIndex !== index)
      if (nextQuestions.length === 0) {
        return [{ question: '', sortOrder: 1 }]
      }

      return nextQuestions.map((question, questionIndex) => ({
        ...question,
        sortOrder: questionIndex + 1,
      }))
    })
  }

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    setQuestions((currentQuestions) => {
      const nextIndex = direction === 'up' ? index - 1 : index + 1
      if (nextIndex < 0 || nextIndex >= currentQuestions.length) {
        return currentQuestions
      }

      const nextQuestions = [...currentQuestions]
      ;[nextQuestions[index], nextQuestions[nextIndex]] = [
        nextQuestions[nextIndex],
        nextQuestions[index],
      ]

      return nextQuestions.map((question, questionIndex) => ({
        ...question,
        sortOrder: questionIndex + 1,
      }))
    })
  }

  const handleSave = () => {
    const normalizedQuestions = normalizeQuestions(questions)

    if (!title.trim()) {
      toast.error('Il titolo del template e obbligatorio.')
      return
    }

    if (normalizedQuestions.length === 0) {
      toast.error('Aggiungi almeno una domanda prima di salvare.')
      return
    }

    startTransition(async () => {
      const result = templateId
        ? await saveTemplateDefinition({
            templateId,
            title: title.trim(),
            description: description.trim() || null,
            questions: normalizedQuestions,
          })
        : await createTemplate({
            title: title.trim(),
            description: description.trim() || undefined,
            questions: normalizedQuestions,
          })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(templateId ? 'Template aggiornato.' : 'Template creato.')

      if (onSaved) {
        onSaved(result.id)
        return
      }

      if (templateId) {
        router.refresh()
        return
      }

      router.push(`/templates/${result.id}`)
      router.refresh()
    })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900">Titolo template</label>
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Es. HACCP Produzione"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-900">Descrizione</label>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Descrivi rapidamente quando usare questo template..."
          rows={3}
          disabled={isPending}
          className="resize-none"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-zinc-900">Domande checklist</div>
            <div className="text-xs text-zinc-500">
              Le domande verranno copiate come snapshot negli audit futuri.
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddQuestion}
            disabled={isPending}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Aggiungi domanda
          </Button>
        </div>

        <div className="space-y-2">
          {questions.map((question, index) => (
            <div
              key={question.id ?? `draft-${index}`}
              className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3"
            >
              <div className="flex w-8 shrink-0 flex-col gap-1 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveQuestion(index, 'up')}
                  disabled={isPending || index === 0}
                  className="h-7 w-7"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMoveQuestion(index, 'down')}
                  disabled={isPending || index === questions.length - 1}
                  className="h-7 w-7"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-2">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  Domanda {index + 1}
                </div>
                <Textarea
                  value={question.question}
                  onChange={(event) => handleUpdateQuestion(index, event.target.value)}
                  placeholder="Inserisci il testo della domanda..."
                  rows={2}
                  disabled={isPending}
                  className="resize-none"
                />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteQuestion(index)}
                disabled={isPending}
                className="h-8 w-8 shrink-0 text-zinc-400 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </Button>
        )}
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {effectiveSubmitLabel}
        </Button>
      </div>
    </div>
  )
}
