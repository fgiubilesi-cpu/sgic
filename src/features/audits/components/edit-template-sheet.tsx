'use client'

import { useEffect, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ChevronUp, ChevronDown, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  getTemplateWithQuestionsAction,
  updateTemplate,
  updateTemplateQuestion,
  addTemplateQuestion,
  softDeleteTemplateQuestion,
  reorderTemplateQuestions,
  type TemplateQuestion,
} from '@/features/audits/actions/template-actions'

interface FormQuestion {
  id?: string
  question: string
  sortOrder: number
  deleted?: boolean
}

interface EditTemplateSheetProps {
  templateId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved: () => void
}

export function EditTemplateSheet({ templateId, open, onOpenChange, onSaved }: EditTemplateSheetProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Carica template e domande al mount
  useEffect(() => {
    if (!open) return

    const loadTemplate = async () => {
      setLoading(true)
      try {
        const res = await getTemplateWithQuestionsAction(templateId)
        if (!res.success) throw new Error(res.error)
        const data = res.data
        if (data) {
          setTitle(data.title)
          setDescription(data.description || '')
          setQuestions(
            data.questions.map((q) => ({
              id: q.id,
              question: q.question,
              sortOrder: q.sort_order || 1,
              deleted: false,
            }))
          )
        } else {
          toast.error('Template non trovato')
          onOpenChange(false)
        }
      } catch (err) {
        console.error('Error loading template:', err)
        toast.error('Errore nel caricamento del template')
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [open, templateId, onOpenChange])

  const handleAddQuestion = () => {
    const newSortOrder = Math.max(...questions.map((q) => q.sortOrder), 0) + 1
    setQuestions([...questions, { question: '', sortOrder: newSortOrder }])
  }

  const handleUpdateQuestion = (index: number, text: string) => {
    const updated = [...questions]
    updated[index].question = text
    setQuestions(updated)
  }

  const handleDeleteQuestion = (index: number) => {
    const updated = [...questions]
    if (updated[index].id) {
      updated[index].deleted = true
    } else {
      updated.splice(index, 1)
    }
    setQuestions(updated)
  }

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    const updated = [...questions]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex >= 0 && newIndex < updated.length) {
      ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
      // Aggiorna sort order
      updated.forEach((q, i) => {
        q.sortOrder = i + 1
      })
      setQuestions(updated)
    }
  }

  const handleSaveTemplate = async () => {
    if (!title.trim()) {
      toast.error('Il titolo è obbligatorio')
      return
    }

    setSaving(true)
    try {
      // 1. Aggiorna template base
      const updateRes = await updateTemplate({
        templateId,
        title,
        description: description || null,
      })

      if (!updateRes.success) {
        toast.error(updateRes.error)
        setSaving(false)
        return
      }

      // 2. Gestisci le domande
      const nonDeletedQuestions = questions.filter((q) => !q.deleted)

      // Aggiungi nuove domande (senza id)
      for (const q of nonDeletedQuestions) {
        if (!q.id) {
          const addRes = await addTemplateQuestion(templateId, q.question)
          if (!addRes.success) {
            toast.error(`Errore nell'aggiunta della domanda: ${addRes.error}`)
            setSaving(false)
            return
          }
        }
      }

      // Aggiorna domande modificate
      for (const q of nonDeletedQuestions) {
        if (q.id) {
          const updateRes = await updateTemplateQuestion({
            questionId: q.id,
            templateId,
            question: q.question,
            sortOrder: q.sortOrder,
          })
          if (!updateRes.success) {
            toast.error(`Errore nell'aggiornamento della domanda: ${updateRes.error}`)
            setSaving(false)
            return
          }
        }
      }

      // Soft-delete domande eliminate
      for (const q of questions.filter((q) => q.deleted && q.id)) {
        const delRes = await softDeleteTemplateQuestion(q.id!, templateId)
        if (!delRes.success) {
          toast.error(`Errore nell'eliminazione della domanda: ${delRes.error}`)
          setSaving(false)
          return
        }
      }

      // Reorder tutte le domande non-deleted
      if (nonDeletedQuestions.length > 0) {
        const reorderRes = await reorderTemplateQuestions({
          templateId,
          questions: nonDeletedQuestions.map((q, idx) => ({
            id: q.id || 'temp',
            sortOrder: idx + 1,
          })),
        })
        if (!reorderRes.success) {
          toast.error(`Errore nel riordino: ${reorderRes.error}`)
          setSaving(false)
          return
        }
      }

      toast.success('Template aggiornato con successo')
      onSaved()
      onOpenChange(false)
    } catch (err) {
      console.error('Error saving template:', err)
      toast.error('Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const visibleQuestions = questions.filter((q) => !q.deleted)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Modifica Template</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="mt-6 flex justify-center">
            <p className="text-sm text-zinc-500">Caricamento...</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-900">Titolo</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Es. Audit Caseificio"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-zinc-900">Descrizione</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrizione opzionale..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-zinc-900">Domande</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddQuestion}
                  className="gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Aggiungi
                </Button>
              </div>

              {visibleQuestions.length > 0 ? (
                <div className="space-y-2">
                  {visibleQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex gap-2 items-start p-2 rounded-lg bg-zinc-50 border border-zinc-200"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded hover:bg-zinc-200 disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(idx, 'down')}
                          disabled={idx === visibleQuestions.length - 1}
                          className="p-1 rounded hover:bg-zinc-200 disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleUpdateQuestion(idx, e.target.value)}
                        placeholder="Testo della domanda..."
                        className="flex-1 px-2 py-1 text-sm rounded border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(idx)}
                        className="p-1 rounded hover:bg-red-100 text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 italic p-2">Nessuna domanda ancora</p>
              )}
            </div>

            <Button
              onClick={handleSaveTemplate}
              disabled={saving}
              className="w-full"
            >
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
