import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Upload, FileText, Loader2, ArrowLeft, Check, X, FileSpreadsheet,
  ArrowUpDown, ChevronDown, Trash2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { parseCSV, parseOFX, parseXLSX, type ImportedTransaction } from '@/utils/parsers'
import { useTransactions } from '@/hooks/useTransactions'
import { useAuth } from '@/hooks/useAuth'
import { TRANSACTION_CATEGORIES } from '@/lib/validations'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Step = 'upload' | 'preview'

const Import = () => {
  const [step, setStep] = useState<Step>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedTransactions, setParsedTransactions] = useState<ImportedTransaction[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const { toast } = useToast()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createTransactions } = useTransactions(user?.id)

  const ACCEPTED_EXTENSIONS = ['.csv', '.ofx', '.xlsx', '.xls']

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    const validFiles = droppedFiles.filter((file) =>
      ACCEPTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))
    )

    if (validFiles.length !== droppedFiles.length) {
      toast({
        title: 'Arquivo inválido',
        description: 'Apenas arquivos .csv, .ofx e .xlsx são aceitos.',
        variant: 'destructive',
      })
    }

    setFiles((prev) => [...prev, ...validFiles])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const parseFiles = async () => {
    if (files.length === 0) return
    setIsParsing(true)

    const allTransactions: ImportedTransaction[] = []
    let errors = 0

    for (const file of files) {
      try {
        let transactions: ImportedTransaction[] = []
        const name = file.name.toLowerCase()

        if (name.endsWith('.csv')) {
          transactions = await parseCSV(file)
        } else if (name.endsWith('.ofx')) {
          transactions = await parseOFX(file)
        } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
          transactions = await parseXLSX(file)
        }

        allTransactions.push(...transactions)
      } catch (err) {
        console.error(`Erro ao parsear ${file.name}:`, err)
        errors++
      }
    }

    if (allTransactions.length === 0) {
      toast({
        title: 'Nenhuma transação encontrada',
        description: errors > 0
          ? `${errors} arquivo(s) com erro. Verifique o formato.`
          : 'Não foi possível ler transações dos arquivos.',
        variant: 'destructive',
      })
      setIsParsing(false)
      return
    }

    if (errors > 0) {
      toast({
        title: 'Aviso',
        description: `${errors} arquivo(s) com erro, mas ${allTransactions.length} transações foram lidas dos demais.`,
      })
    }

    setParsedTransactions(allTransactions)
    setSelectedIds(new Set(allTransactions.map((_, i) => i)))
    setStep('preview')
    setIsParsing(false)
  }

  const updateTransactionCategory = (index: number, category: string) => {
    setParsedTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, category } : t))
    )
  }

  const updateTransactionType = (index: number, type: 'income' | 'expense') => {
    setParsedTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, type } : t))
    )
  }

  const toggleSelect = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === parsedTransactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(parsedTransactions.map((_, i) => i)))
    }
  }

  const stats = useMemo(() => {
    const selected = parsedTransactions.filter((_, i) => selectedIds.has(i))
    const income = selected.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expense = selected.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { total: selected.length, income, expense }
  }, [parsedTransactions, selectedIds])

  const saveTransactions = async () => {
    const selected = parsedTransactions.filter((_, i) => selectedIds.has(i))
    if (selected.length === 0) {
      toast({ title: 'Nenhuma transação selecionada', variant: 'destructive' })
      return
    }

    setIsProcessing(true)
    try {
      const toCreate = selected.map((t) => ({
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category || 'Outros',
        date: t.date,
        payment_method: 'bank_transfer' as const,
        is_recurring: false,
      }))

      await createTransactions(toCreate)

      toast({
        title: 'Importação concluída!',
        description: `${toCreate.length} transações importadas com sucesso.`,
      })

      setFiles([])
      setParsedTransactions([])
      navigate('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error.message || 'Erro ao salvar transações.',
        variant: 'destructive',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  // ──────────── UPLOAD STEP ────────────
  if (step === 'upload') {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6 animate-fade-in max-w-3xl">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Importar Transações</h1>
          <p className="text-sm text-muted-foreground">
            Importe extratos bancários (OFX, CSV ou Excel) para atualizar seu fluxo de caixa.
          </p>
        </div>

        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent
            className={`flex flex-col items-center justify-center p-8 md:p-12 transition-colors ${
              isDragging ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="p-4 rounded-full bg-primary/10 mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Arraste e solte seus arquivos aqui</h3>
            <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
              Suporta <strong>OFX</strong>, <strong>CSV</strong> e <strong>Excel (.xlsx)</strong>. Múltiplos arquivos de uma vez.
            </p>
            <div className="flex gap-3">
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept=".csv,.ofx,.xlsx,.xls"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileSelect}
                  disabled={isParsing}
                />
                <label htmlFor="file-upload">
                  <Button variant="outline" className="cursor-pointer" disabled={isParsing} asChild>
                    <span>Selecionar Arquivos</span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="flex gap-4 mt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> OFX</span>
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> CSV</span>
              <span className="flex items-center gap-1"><FileSpreadsheet className="w-3 h-3" /> Excel</span>
            </div>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Arquivos Selecionados</CardTitle>
              <CardDescription>Revise antes de processar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted">
                      {file.name.endsWith('.xlsx') || file.name.endsWith('.xls') ? (
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                    disabled={isParsing}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button onClick={parseFiles} disabled={isParsing}>
                  {isParsing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Lendo arquivos...
                    </>
                  ) : (
                    `Processar ${files.length} arquivo${files.length > 1 ? 's' : ''}`
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ──────────── PREVIEW STEP ────────────
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setStep('upload'); setParsedTransactions([]) }}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Revisar Transações</h1>
            <p className="text-sm text-muted-foreground">
              {parsedTransactions.length} transações encontradas - revise categorias e selecione quais importar
            </p>
          </div>
        </div>
        <Button onClick={saveTransactions} disabled={isProcessing || selectedIds.size === 0}>
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Importar {selectedIds.size} transações
            </>
          )}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Selecionadas</p>
          <p className="text-lg font-bold">{stats.total}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Receitas</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(stats.income)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Despesas</p>
          <p className="text-lg font-bold text-red-500">{formatCurrency(stats.expense)}</p>
        </Card>
      </div>

      {/* Transaction Table */}
      <Card>
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            <input
              type="checkbox"
              checked={selectedIds.size === parsedTransactions.length}
              onChange={toggleSelectAll}
              className="rounded border-muted-foreground/30"
            />
            <span className="w-20">Data</span>
            <span className="flex-1 min-w-0">Descrição</span>
            <span className="w-24 text-right">Valor</span>
            <span className="w-16 text-center">Tipo</span>
            <span className="w-32">Categoria</span>
          </div>

          {/* Rows */}
          <div className="max-h-[60vh] overflow-y-auto divide-y">
            {parsedTransactions.map((t, i) => {
              const isSelected = selectedIds.has(i)
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${
                    isSelected ? 'bg-background' : 'bg-muted/30 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(i)}
                    className="rounded border-muted-foreground/30"
                  />

                  <span className="w-20 text-xs text-muted-foreground shrink-0">
                    {(() => {
                      try {
                        return format(new Date(t.date), 'dd/MM/yy', { locale: ptBR })
                      } catch {
                        return '--/--/--'
                      }
                    })()}
                  </span>

                  <span className="flex-1 min-w-0 truncate" title={t.description}>
                    {t.description}
                  </span>

                  <span className={`w-24 text-right font-medium tabular-nums shrink-0 ${
                    t.type === 'income' ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>

                  <div className="w-16 flex justify-center shrink-0">
                    <button
                      onClick={() => updateTransactionType(i, t.type === 'income' ? 'expense' : 'income')}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        t.type === 'income'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                      title="Clique para alternar tipo"
                    >
                      {t.type === 'income' ? 'Rec' : 'Desp'}
                    </button>
                  </div>

                  <div className="w-32 shrink-0">
                    <select
                      value={t.category || 'Outros'}
                      onChange={(e) => updateTransactionCategory(i, e.target.value)}
                      className="w-full text-xs bg-transparent border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {TRANSACTION_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Import
