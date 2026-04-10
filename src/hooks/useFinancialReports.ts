import { useMemo } from 'react';
import { Transaction } from '@/types';
import { startOfMonth, endOfMonth, subMonths, isWithinInterval, parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DRELineItem {
    name: string;
    value: number;
    percentage: number; // Vertical analysis % based on Net Revenue
    type: 'revenue' | 'cost' | 'expense' | 'result';
    isTotal?: boolean;
    level?: number; // Indentation level
}

export interface DREData {
    grossRevenue: number;
    deductions: number;
    netRevenue: number;
    variableCosts: number;
    grossProfit: number;
    operatingExpenses: number;
    ebitda: number;
    netIncome: number;
    items: DRELineItem[];
    periodLabel: string;
    isEmpty: boolean;
}

function buildDRE(monthlyTransactions: Transaction[], periodLabel: string): DREData {
    const empty: DREData = {
        grossRevenue: 0, deductions: 0, netRevenue: 0, variableCosts: 0,
        grossProfit: 0, operatingExpenses: 0, ebitda: 0, netIncome: 0,
        items: [], periodLabel, isEmpty: true,
    };

    if (monthlyTransactions.length === 0) return empty;

    // Normalize category (handle lowercase "outros" etc.)
    const normCat = (cat: string) => {
        if (!cat) return 'Outros';
        const lower = cat.toLowerCase();
        // Map known variants
        if (lower === 'outros') return 'Outros';
        if (lower === 'utilidades') return 'Fixo'; // utilities = fixed costs
        if (lower === 'pessoal') return 'Salários'; // personal = salaries
        if (lower === 'dívidas' || lower === 'dividas') return 'Fixo'; // debt payments = fixed
        return cat;
    };

    // Use type field as source of truth — ignore category for revenue vs expense classification
    const grossRevenue = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    // Deductions: only taxes categorized as expense
    const deductions = monthlyTransactions
        .filter(t => t.type === 'expense' && normCat(t.category) === 'Impostos')
        .reduce((sum, t) => sum + t.amount, 0);

    const netRevenue = grossRevenue - deductions;

    // Variable costs
    const variableCostCats = ['Fornecedores', 'Variável'];
    const variableCosts = monthlyTransactions
        .filter(t => t.type === 'expense' && variableCostCats.includes(normCat(t.category)))
        .reduce((sum, t) => sum + t.amount, 0);

    const grossProfit = netRevenue - variableCosts;

    // Operating expenses: all other expenses
    const excludeFromOpex = ['Impostos', ...variableCostCats];
    const operatingExpenses = monthlyTransactions
        .filter(t => t.type === 'expense' && !excludeFromOpex.includes(normCat(t.category)))
        .reduce((sum, t) => sum + t.amount, 0);

    const ebitda = grossProfit - operatingExpenses;
    const netIncome = ebitda;

    // Build breakdown of operating expenses by category
    const opexByCategory = new Map<string, number>();
    monthlyTransactions
        .filter(t => t.type === 'expense' && !excludeFromOpex.includes(normCat(t.category)))
        .forEach(t => {
            const cat = normCat(t.category);
            opexByCategory.set(cat, (opexByCategory.get(cat) || 0) + t.amount);
        });

    // Use total expenses as base when revenue is zero (more useful than all 0%)
    const base = netRevenue > 0 ? netRevenue : (grossRevenue > 0 ? grossRevenue : (deductions + variableCosts + operatingExpenses));
    const getPercent = (val: number) => (base === 0 ? 0 : (val / base) * 100);

    const items: DRELineItem[] = [
        { name: 'Receita Bruta', value: grossRevenue, percentage: getPercent(grossRevenue), type: 'revenue', level: 0 },
        { name: '(-) Deduções / Impostos', value: deductions, percentage: getPercent(deductions), type: 'cost', level: 0 },
        { name: '(=) Receita Líquida', value: netRevenue, percentage: netRevenue > 0 ? 100 : getPercent(netRevenue), type: 'result', isTotal: true, level: 0 },

        { name: '(-) Custos Variáveis (CMV/CPV)', value: variableCosts, percentage: getPercent(variableCosts), type: 'cost', level: 0 },
        { name: '(=) Lucro Bruto', value: grossProfit, percentage: getPercent(grossProfit), type: 'result', isTotal: true, level: 0 },

        { name: '(-) Despesas Operacionais', value: operatingExpenses, percentage: getPercent(operatingExpenses), type: 'expense', level: 0 },
    ];

    // Add expense breakdown by category
    const sortedOpex = Array.from(opexByCategory.entries()).sort((a, b) => b[1] - a[1]);
    for (const [cat, amount] of sortedOpex) {
        items.push({ name: cat, value: amount, percentage: getPercent(amount), type: 'expense', level: 1 });
    }

    items.push(
        { name: '(=) EBITDA / Lucro Operacional', value: ebitda, percentage: getPercent(ebitda), type: 'result', isTotal: true, level: 0 },
        { name: '(=) Resultado Líquido', value: netIncome, percentage: getPercent(netIncome), type: 'result', isTotal: true, level: 0 },
    );

    return {
        grossRevenue, deductions, netRevenue, variableCosts,
        grossProfit, operatingExpenses, ebitda, netIncome,
        items, periodLabel, isEmpty: false,
    };
}

export function useFinancialReports(transactions: Transaction[], month: Date) {
    const dreData = useMemo(() => {
        // Try current month first
        const range = { start: startOfMonth(month), end: endOfMonth(month) };
        const monthlyTransactions = transactions.filter((t) => {
            try { return isWithinInterval(parseISO(t.date), range); } catch { return false; }
        });

        const currentLabel = format(month, 'MMMM yyyy', { locale: ptBR });

        if (monthlyTransactions.length >= 3) {
            return buildDRE(monthlyTransactions, currentLabel);
        }

        // Fallback: find the most recent month with enough data (up to 6 months back)
        for (let i = 1; i <= 6; i++) {
            const fallbackMonth = subMonths(month, i);
            const fallbackRange = { start: startOfMonth(fallbackMonth), end: endOfMonth(fallbackMonth) };
            const fallbackTransactions = transactions.filter((t) => {
                try { return isWithinInterval(parseISO(t.date), fallbackRange); } catch { return false; }
            });

            if (fallbackTransactions.length >= 3) {
                const label = format(fallbackMonth, 'MMMM yyyy', { locale: ptBR });
                return buildDRE(fallbackTransactions, label);
            }
        }

        // No month has enough data — show current month anyway (will show empty state)
        return buildDRE(monthlyTransactions, currentLabel);
    }, [transactions, month]);

    return { dreData };
}
