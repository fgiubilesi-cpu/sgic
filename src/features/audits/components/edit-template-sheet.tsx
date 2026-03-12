'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { toast } from 'sonner'
import {
  getTemplateWithQuestionsAction,
  type TemplateWithQuestions,
} from '@/features/audits/actions/template-actions'
import {
  TemplateEditorForm,
  type TemplateEditorQuestion,
} from '@/features/audits/components/template-editor-form'

interface EditTemplateSheetProps {
  templateId: string
  open: boolean
  onOpenChange: (value: boolean) => void
  onSaved: (templateId: string) => void
}

function mapQuestions(template: TemplateWithQuestions): TemplateEditorQuestion[] {
  return template.questions.map((question, index) => ({
    id: question.id,
    question: question.question,
    sortOrder: question.sort_order ?? index + 1,
  }))
}

export function EditTemplateSheet({
  templateId,
  open,
  onOpenChange,
  onSaved,
}: EditTemplateSheetProps) {
  const [template, setTemplate] = useState<TemplateWithQuestions | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!open || !templateId) return

    let isMounted = true

    const loadTemplate = async () => {
      setIsLoading(true)

      try {
        const result = await getTemplateWithQuestionsAction(templateId)
        if (!result.success) {
          throw new Error(result.error)
        }

        if (isMounted) {
          setTemplate(result.data)
        }
      } catch (error) {
        console.error('Error loading template:', error)
        toast.error('Impossibile caricare il template.')
        if (isMounted) {
          onOpenChange(false)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadTemplate()

    return () => {
      isMounted = false
    }
  }, [open, templateId, onOpenChange])

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setTemplate(null)
        }
        onOpenChange(nextOpen)
      }}
    >
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Modifica template</SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {isLoading || !template ? (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
              Caricamento template...
            </div>
          ) : (
            <TemplateEditorForm
              templateId={templateId}
              initialTitle={template.title}
              initialDescription={template.description ?? ''}
              initialQuestions={mapQuestions(template)}
              submitLabel="Salva template"
              onSaved={(savedTemplateId) => {
                onSaved(savedTemplateId)
                onOpenChange(false)
              }}
              onCancel={() => onOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
