import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Mail, FileText, Loader2, FileSpreadsheet } from 'lucide-react';
import { exportService, type ExportData, type ExportOptions } from '@/services/export.service';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, subMonths } from 'date-fns';

interface ExportReportProps {
  data: ExportData;
  trigger?: React.ReactNode;
}

export const ExportReport = ({ data, trigger }: ExportReportProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'xlsx' | 'email'>('pdf');
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [email, setEmail] = useState(data.userEmail || '');
  const [isExporting, setIsExporting] = useState(false);

  // Opções de inclusão
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [includeGoals, setIncludeGoals] = useState(true);
  const [includeInsights, setIncludeInsights] = useState(true);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const options: ExportOptions = {
        format: exportType,
        period,
        includeCharts,
        includeTransactions,
        includeGoals,
        includeInsights,
      };

      // Ajustar dados baseado no período selecionado
      const adjustedData = adjustDataByPeriod(data, period);

      if (exportType === 'pdf') {
        await exportService.downloadPDF(adjustedData, options);
        toast({
          title: 'PDF gerado com sucesso!',
          description: 'O relatório foi baixado para seu computador.',
        });
      } else if (exportType === 'xlsx') {
        exportService.generateXLSX(adjustedData);
        toast({
          title: 'Planilha gerada!',
          description: 'O arquivo .xlsx foi baixado. Pronto para enviar ao contador.',
        });
      } else {
        // Email
        if (!email || !email.includes('@')) {
          toast({
            title: 'Email inválido',
            description: 'Por favor, insira um email válido.',
            variant: 'destructive',
          });
          setIsExporting(false);
          return;
        }

        const result = await exportService.sendEmailReport(adjustedData, email, options);

        if (result.success) {
          toast({
            title: 'Email enviado!',
            description: result.message,
          });
          setOpen(false);
        } else {
          toast({
            title: 'Erro ao enviar email',
            description: result.message,
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Ocorreu um erro ao gerar o relatório. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
      if (exportType === 'pdf') {
        setOpen(false);
      }
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week':
        return 'Últimos 7 dias';
      case 'month':
        return 'Último mês';
      case 'quarter':
        return 'Últimos 3 meses';
      default:
        return 'Último mês';
    }
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Exportar Relatório
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Exportar Relatório Financeiro</DialogTitle>
            <DialogDescription>
              Gere um relatório completo com suas informações financeiras do período selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Tipo de Export */}
            <div className="space-y-2">
              <Label>Formato de Exportação</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={exportType === 'pdf' ? 'default' : 'outline'}
                  className="gap-1.5 text-sm"
                  onClick={() => setExportType('pdf')}
                >
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant={exportType === 'xlsx' ? 'default' : 'outline'}
                  className="gap-1.5 text-sm"
                  onClick={() => setExportType('xlsx')}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Planilha
                </Button>
                <Button
                  variant={exportType === 'email' ? 'default' : 'outline'}
                  className="gap-1.5 text-sm"
                  onClick={() => setExportType('email')}
                >
                  <Mail className="h-4 w-4" />
                  E-mail
                </Button>
              </div>
              {exportType === 'xlsx' && (
                <p className="text-xs text-muted-foreground">
                  Gera um .xlsx com todas as transações categorizadas + resumo por categoria. Ideal para enviar ao contador.
                </p>
              )}
            </div>

            {/* Email (se email selecionado) */}
            {exportType === 'email' && (
              <div className="space-y-2">
                <Label htmlFor="email">Email de Destino</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  O relatório será enviado para este email em formato PDF.
                </p>
              </div>
            )}

            {/* Período */}
            <div className="space-y-2">
              <Label>Período do Relatório</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Últimos 7 dias</SelectItem>
                  <SelectItem value="month">Último mês (30 dias)</SelectItem>
                  <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opções de inclusão */}
            <div className="space-y-3">
              <Label>Incluir no Relatório</Label>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charts"
                    checked={includeCharts}
                    onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                  />
                  <label
                    htmlFor="charts"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Gráficos e visualizações
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transactions"
                    checked={includeTransactions}
                    onCheckedChange={(checked) => setIncludeTransactions(checked as boolean)}
                  />
                  <label
                    htmlFor="transactions"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Lista de transações
                  </label>
                </div>

                {data.goals && data.goals.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="goals"
                      checked={includeGoals}
                      onCheckedChange={(checked) => setIncludeGoals(checked as boolean)}
                    />
                    <label
                      htmlFor="goals"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Metas financeiras
                    </label>
                  </div>
                )}

                {data.insights && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="insights"
                      checked={includeInsights}
                      onCheckedChange={(checked) => setIncludeInsights(checked as boolean)}
                    />
                    <label
                      htmlFor="insights"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Insights de IA
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Preview info */}
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-2">Resumo do Relatório:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Período: {getPeriodLabel()}</li>
                <li>• Transações: {data.transactions.length} registradas</li>
                {data.goals && <li>• Metas: {data.goals.length} ativas</li>}
                <li>
                  • Formato: {exportType === 'pdf' ? 'Download em PDF' : `Envio para ${email || '(email)'}`}
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isExporting}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={isExporting} className="gap-2">
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {exportType === 'pdf' ? 'Gerando PDF...' : 'Enviando...'}
                </>
              ) : (
                <>
                  {exportType === 'pdf' ? (
                    <>
                      <Download className="h-4 w-4" />
                      Baixar PDF
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Enviar Email
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * Ajusta os dados baseado no período selecionado
 */
function adjustDataByPeriod(data: ExportData, period: 'week' | 'month' | 'quarter'): ExportData {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = subDays(now, 7);
      break;
    case 'month':
      startDate = subDays(now, 30);
      break;
    case 'quarter':
      startDate = subMonths(now, 3);
      break;
  }

  // Filtrar transações do período
  const filteredTransactions = data.transactions.filter((t) => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= now;
  });

  // Recalcular KPIs baseado nas transações filtradas
  const totalRevenue = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = totalRevenue - totalExpenses;

  return {
    ...data,
    periodStart: format(startDate, 'yyyy-MM-dd'),
    periodEnd: format(now, 'yyyy-MM-dd'),
    transactions: filteredTransactions,
    totalRevenue,
    totalExpenses,
    savings,
  };
}
