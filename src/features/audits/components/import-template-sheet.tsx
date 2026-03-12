'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  importTemplateModeValues,
  importTemplateQuestions,
  type ImportTemplateMode,
} from '@/features/audits/actions/import-template-actions'

type TemplateOption = {
  id: string
  title: string
}

type ParsedQuestion = {
  sort_order: number
  question: string
}

type WorkbookData = {
  fileName: string
  sheetNames: string[]
  sheets: Record<string, Array<Array<string | number | null>>>
}

type ImportTemplateSheetProps = {
  templates?: TemplateOption[]
}

const EMPTY_ROWS: Array<Array<string | number | null>> = []

function getColumnLetter(index: number) {
  let currentIndex = index
  let result = ''

  while (currentIndex >= 0) {
    result = String.fromCharCode((currentIndex % 26) + 65) + result
    currentIndex = Math.floor(currentIndex / 26) - 1
  }

  return result
}

function normalizeCellValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function buildColumnOptions(rows: Array<Array<string | number | null>>) {
  const columnCount = rows.reduce((maxColumns, row) => Math.max(maxColumns, row.length), 0)
  const headerRow = rows[0] ?? []

  return Array.from({ length: columnCount }, (_, index) => {
    const headerValue = normalizeCellValue(headerRow[index])
    return {
      value: String(index),
      label: headerValue ? `${getColumnLetter(index)} - ${headerValue}` : getColumnLetter(index),
    }
  })
}

function parseQuestionsFromSheet(params: {
  rows: Array<Array<string | number | null>>
  questionColumn: string
  orderColumn: string
  skipHeader: boolean
}) {
  const { rows, questionColumn, orderColumn, skipHeader } = params
  const startIndex = skipHeader ? 1 : 0
  const questionIndex = Number(questionColumn)
  const orderIndex = orderColumn === 'auto' ? null : Number(orderColumn)

  const parsedQuestions: ParsedQuestion[] = []
  let skippedRows = 0

  rows.slice(startIndex).forEach((row, rowIndex) => {
    const question = normalizeCellValue(row[questionIndex])
    if (!question) {
      skippedRows += 1
      return
    }

    const rawOrder =
      orderIndex === null ? null : Number(normalizeCellValue(row[orderIndex]).replace(',', '.'))
    const sortOrder =
      rawOrder !== null && Number.isFinite(rawOrder) && rawOrder > 0
        ? Math.trunc(rawOrder)
        : rowIndex + 1

    parsedQuestions.push({
      sort_order: sortOrder,
      question,
    })
  })

  const normalizedQuestions = parsedQuestions
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((question, index) => ({
      sort_order: index + 1,
      question: question.question,
    }))

  return {
    parsedQuestions: normalizedQuestions,
    skippedRows,
  }
}

export function ImportTemplateSheet({ templates = [] }: ImportTemplateSheetProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [workbook, setWorkbook] = useState<WorkbookData | null>(null)
  const [selectedSheet, setSelectedSheet] = useState('')
  const [questionColumn, setQuestionColumn] = useState('')
  const [orderColumn, setOrderColumn] = useState('auto')
  const [skipHeader, setSkipHeader] = useState(true)
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([])
  const [skippedRows, setSkippedRows] = useState(0)
  const [mode, setMode] = useState<ImportTemplateMode>('create')
  const [templateId, setTemplateId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const selectedRows =
    workbook && selectedSheet ? workbook.sheets[selectedSheet] ?? EMPTY_ROWS : EMPTY_ROWS
  const columnOptions = buildColumnOptions(selectedRows)

  useEffect(() => {
    if (!workbook) return

    const firstSheet = workbook.sheetNames[0] ?? ''
    if (!selectedSheet && firstSheet) {
      setSelectedSheet(firstSheet)
    }

    if (!title.trim()) {
      const fileBaseName = workbook.fileName.replace(/\.[^.]+$/, '')
      setTitle(fileBaseName)
    }
  }, [workbook, selectedSheet, title])

  useEffect(() => {
    if (!selectedRows.length) {
      setQuestionColumn((currentValue) => (currentValue === '' ? currentValue : ''))
      setOrderColumn((currentValue) => (currentValue === 'auto' ? currentValue : 'auto'))
      return
    }

    const options = buildColumnOptions(selectedRows)
    if (!questionColumn && options.length > 0) {
      setQuestionColumn(options[Math.min(1, options.length - 1)]?.value ?? options[0].value)
    }
  }, [selectedRows, questionColumn])

  useEffect(() => {
    if (!selectedRows.length || questionColumn === '') {
      setParsedQuestions((currentValue) => (currentValue.length === 0 ? currentValue : []))
      setSkippedRows((currentValue) => (currentValue === 0 ? currentValue : 0))
      return
    }

    const result = parseQuestionsFromSheet({
      rows: selectedRows,
      questionColumn,
      orderColumn,
      skipHeader,
    })

    setParsedQuestions(result.parsedQuestions)
    setSkippedRows(result.skippedRows)
  }, [selectedRows, questionColumn, orderColumn, skipHeader])

  const resetState = () => {
    setWorkbook(null)
    setSelectedSheet('')
    setQuestionColumn('')
    setOrderColumn('auto')
    setSkipHeader(true)
    setParsedQuestions([])
    setSkippedRows(0)
    setMode('create')
    setTemplateId('')
    setTitle('')
    setDescription('')
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsBusy(true)
      const data = await file.arrayBuffer()
      const workbookFile = XLSX.read(data, { type: 'array' })

      const sheets = Object.fromEntries(
        workbookFile.SheetNames.map((sheetName) => {
          const worksheet = workbookFile.Sheets[sheetName]
          const rows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: null,
            blankrows: false,
          }) as Array<Array<string | number | null>>

          return [sheetName, rows]
        })
      )

      setWorkbook({
        fileName: file.name,
        sheetNames: workbookFile.SheetNames,
        sheets,
      })
      setSelectedSheet(workbookFile.SheetNames[0] ?? '')
      setQuestionColumn('')
      setOrderColumn('auto')
      toast.success(`File caricato: ${file.name}`)
    } catch (error) {
      console.error('Excel parse error:', error)
      toast.error('Impossibile leggere il file Excel.')
    } finally {
      setIsBusy(false)
      event.target.value = ''
    }
  }

  const handleImport = async () => {
    if (parsedQuestions.length === 0) {
      toast.error('Nessuna domanda valida da importare.')
      return
    }

    if (mode === 'create' && !title.trim()) {
      toast.error('Inserisci il titolo del nuovo template.')
      return
    }

    if ((mode === 'append' || mode === 'replace') && !templateId) {
      toast.error('Seleziona un template esistente.')
      return
    }

    setIsBusy(true)

    try {
      const result =
        mode === 'create'
          ? await importTemplateQuestions({
              mode,
              title: title.trim(),
              description: description.trim() || undefined,
              questions: parsedQuestions,
            })
          : await importTemplateQuestions({
              mode,
              templateId,
              questions: parsedQuestions,
            })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(
        result.mode === 'create'
          ? `Template creato con ${result.importedCount} domande.`
          : `Import completato: ${result.importedCount} domande sincronizzate.`
      )

      setOpen(false)
      resetState()
      router.push(`/templates/${result.templateId}`)
      router.refresh()
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Importazione non riuscita.')
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          resetState()
        }
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2" size="sm">
          <Upload className="h-4 w-4" />
          Importa Excel
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
        <SheetHeader className="border-b pb-4 text-left">
          <SheetTitle className="text-xl">Import checklist da Excel</SheetTitle>
          <SheetDescription>
            Carica un file, verifica il mapping delle colonne e decidi se creare un nuovo template
            oppure aggiornare un template esistente.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-900">File checklist</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              disabled={isBusy}
              className="block w-full rounded-lg border border-zinc-200 bg-white p-2 text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200"
            />
            {workbook ? (
              <p className="text-xs text-zinc-500">
                File caricato: <span className="font-medium text-zinc-700">{workbook.fileName}</span>
              </p>
            ) : null}
          </div>

          {workbook ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Sheet</label>
                  <Select value={selectedSheet} onValueChange={setSelectedSheet}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona sheet" />
                    </SelectTrigger>
                    <SelectContent>
                      {workbook.sheetNames.map((sheetName) => (
                        <SelectItem key={sheetName} value={sheetName}>
                          {sheetName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Colonna domanda</label>
                  <Select value={questionColumn} onValueChange={setQuestionColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona colonna" />
                    </SelectTrigger>
                    <SelectContent>
                      {columnOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-900">Colonna ordine</label>
                  <Select value={orderColumn} onValueChange={setOrderColumn}>
                    <SelectTrigger>
                      <SelectValue placeholder="Auto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto progressivo</SelectItem>
                      {columnOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={skipHeader}
                  onChange={(event) => setSkipHeader(event.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Salta la prima riga come intestazione
              </label>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-900">Modalita import</label>
                    <Select value={mode} onValueChange={(value) => setMode(value as ImportTemplateMode)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {importTemplateModeValues.map((modeValue) => (
                          <SelectItem key={modeValue} value={modeValue}>
                            {modeValue === 'create'
                              ? 'Crea nuovo template'
                              : modeValue === 'append'
                                ? 'Aggiungi a template esistente'
                                : 'Sostituisci domande template'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {mode === 'create' ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-900">Titolo nuovo template</label>
                      <Input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Es. HACCP Produzione"
                        disabled={isBusy}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-zinc-900">Template destinazione</label>
                      <Select value={templateId} onValueChange={setTemplateId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {mode === 'create' ? (
                  <div className="mt-4 space-y-2">
                    <label className="text-sm font-medium text-zinc-900">Descrizione</label>
                    <Input
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Descrizione opzionale del template importato"
                      disabled={isBusy}
                    />
                  </div>
                ) : null}

                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  {mode === 'replace'
                    ? 'Replace: le domande attive del template verranno archiviate e sostituite con quelle importate.'
                    : mode === 'append'
                      ? 'Append: le nuove domande verranno accodate dopo quelle gia presenti.'
                      : 'Create: viene creato un nuovo template con le domande importate.'}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-zinc-900">
                      Preview domande ({parsedQuestions.length})
                    </div>
                    <div className="text-xs text-zinc-500">
                      {skippedRows > 0 ? `${skippedRows} righe scartate perche senza domanda.` : 'Nessuna riga scartata.'}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Ordine</TableHead>
                        <TableHead>Domanda</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedQuestions.slice(0, 15).map((question) => (
                        <TableRow key={`${question.sort_order}-${question.question}`}>
                          <TableCell className="text-sm text-zinc-600">{question.sort_order}</TableCell>
                          <TableCell className="text-sm text-zinc-900">{question.question}</TableCell>
                        </TableRow>
                      ))}
                      {parsedQuestions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="py-8 text-center text-sm text-zinc-500">
                            Nessuna domanda valida rilevata con il mapping corrente.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>

                {parsedQuestions.length > 15 ? (
                  <p className="text-xs text-zinc-500">
                    Mostrando le prime 15 domande su {parsedQuestions.length}.
                  </p>
                ) : null}
              </div>

              <Button onClick={handleImport} disabled={isBusy || parsedQuestions.length === 0} className="w-full">
                {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Importa checklist
              </Button>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-12 text-center text-sm text-zinc-500">
              Carica un file Excel o CSV per iniziare il mapping della checklist.
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
