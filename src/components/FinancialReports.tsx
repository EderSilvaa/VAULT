import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinancialReports, DRELineItem } from '@/hooks/useFinancialReports';
import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { FileText, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';

interface FinancialReportsProps {
    transactions: Transaction[];
    currentDate?: Date;
}

export const FinancialReports = ({ transactions, currentDate = new Date() }: FinancialReportsProps) => {
    const { dreData } = useFinancialReports(transactions, currentDate);

    const getRowStyle = (item: DRELineItem) => {
        if (item.isTotal) return "font-bold bg-muted/30";
        if (item.level === 1) return "pl-8 text-sm text-muted-foreground";
        return "text-sm";
    };

    const getValueColor = (item: DRELineItem) => {
        if (item.type === 'revenue') return 'text-success';
        if (item.type === 'cost' || item.type === 'expense') return 'text-destructive';
        if (item.value < 0) return 'text-destructive';
        return 'text-foreground';
    }

    const getItemIcon = (item: DRELineItem) => {
        if (item.type === 'revenue') return <TrendingUp className="h-4 w-4 shrink-0 text-success opacity-70" />;
        if (item.type === 'expense') return <TrendingDown className="h-4 w-4 shrink-0 text-destructive opacity-70" />;
        if (item.type === 'result') return <DollarSign className="h-4 w-4 shrink-0 text-primary opacity-70" />;
        return null;
    };

    return (
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary" />
                            Relatórios Financeiros
                        </CardTitle>
                        <CardDescription>
                            {dreData.isEmpty
                                ? 'Sem dados suficientes para gerar relatório'
                                : `Análise detalhada de ${dreData.periodLabel}`}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="dre" className="w-full">
                    <TabsList className="mb-6 !grid !h-auto w-full !grid-cols-1 gap-1 sm:!grid-cols-2">
                        <TabsTrigger
                            value="dre"
                            className="!h-auto w-full justify-start !whitespace-normal px-3 py-2 text-left text-xs leading-tight sm:justify-center sm:text-center sm:text-sm"
                        >
                            DRE (Demonstrativo de Resultado)
                        </TabsTrigger>
                        <TabsTrigger
                            value="cashflow"
                            className="!h-auto w-full justify-start !whitespace-normal px-3 py-2 text-left text-xs leading-tight sm:justify-center sm:text-center sm:text-sm"
                        >
                            Fluxo de Caixa
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="dre" className="space-y-4">
                        {/* Mobile layout */}
                        <div className="rounded-xl border border-border overflow-hidden sm:hidden">
                            {dreData.items.map((item, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between px-4 py-3 ${
                                        item.isTotal
                                            ? 'bg-muted/40 border-t border-b border-border'
                                            : index > 0 ? 'border-t border-border/40' : ''
                                    } ${item.level === 1 ? 'pl-8' : ''}`}
                                >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        {getItemIcon(item)}
                                        <span className={`text-xs leading-tight truncate ${
                                            item.isTotal ? 'font-bold text-sm' : 'text-muted-foreground'
                                        }`}>
                                            {item.name}
                                        </span>
                                    </div>
                                    <span className={`text-sm font-semibold whitespace-nowrap ml-3 ${getValueColor(item)}`}>
                                        {formatCurrency(item.value)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="hidden rounded-xl border border-border sm:block">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[560px]">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="p-3 text-left text-xs font-semibold sm:p-4 sm:text-sm">Descrição</th>
                                            <th className="p-3 text-right text-xs font-semibold sm:p-4 sm:text-sm">Valor</th>
                                            <th className="w-20 p-3 text-right text-xs font-semibold sm:w-24 sm:p-4 sm:text-sm">A.V. %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dreData.items.map((item, index) => (
                                            <tr
                                                key={index}
                                                className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${getRowStyle(item)}`}
                                            >
                                                <td className="p-3 align-top sm:p-4">
                                                    <div className="flex items-start gap-2">
                                                        {getItemIcon(item)}
                                                        <span className="break-words">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className={`whitespace-nowrap p-3 text-right align-top sm:p-4 ${getValueColor(item)}`}>
                                                    {formatCurrency(item.value)}
                                                </td>
                                                <td className="whitespace-nowrap p-3 text-right text-xs text-muted-foreground align-top sm:p-4">
                                                    {item.percentage.toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {dreData.netRevenue > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <p className="text-xs text-muted-foreground mb-1">Margem Bruta</p>
                                    <p className="text-xl font-bold text-primary sm:text-2xl">
                                        {((dreData.grossProfit / dreData.netRevenue) * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <p className="text-xs text-muted-foreground mb-1">Margem Operacional</p>
                                    <p className="text-xl font-bold text-primary sm:text-2xl">
                                        {((dreData.ebitda / dreData.netRevenue) * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <p className="text-xs text-muted-foreground mb-1">Margem Líquida</p>
                                    <p className="text-xl font-bold text-primary sm:text-2xl">
                                        {((dreData.netIncome / dreData.netRevenue) * 100).toFixed(1)}%
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                                    <p className="text-xs text-muted-foreground mb-1">Total de Despesas</p>
                                    <p className="text-xl font-bold text-destructive sm:text-2xl">
                                        {formatCurrency(dreData.operatingExpenses + dreData.variableCosts + dreData.deductions)}
                                    </p>
                                </div>
                                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                    <p className="text-xs text-muted-foreground mb-1">Resultado</p>
                                    <p className="text-xl font-bold text-orange-500 sm:text-2xl">
                                        Sem receita no período
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="cashflow">
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <FileText className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Fluxo de Caixa Detalhado</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                    A visualização detalhada de fluxo de caixa (Operacional, Investimento, Financiamento) estará disponível em breve.
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
};
