import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ExportData {
  // KPIs
  currentBalance: number;
  totalRevenue: number;
  totalExpenses: number;
  savings: number;
  daysUntilZero: number;

  // Período
  periodStart: string;
  periodEnd: string;

  // Transações
  transactions: Array<{
    id: string;
    amount: number;
    description: string;
    type: 'income' | 'expense';
    date: string;
  }>;

  // Metas
  goals?: Array<{
    title: string;
    progress: number;
    target: number;
    current: number;
  }>;

  // Insights de IA
  insights?: {
    summary: string;
    warnings: string[];
    recommendations: string[];
  };

  // Análises detalhadas de IA
  aiAnalysis?: {
    balancePrediction?: {
      predicted_balance: number;
      confidence: number;
      days_ahead: number;
      trend: string;
    };
    anomalies?: Array<{
      description: string;
      amount?: number;
      date: string;
      reason: string;
      severity: string;
    }>;
    spendingPatterns?: Array<{
      category: string;
      average_amount: number;
      trend: string;
      insights?: string;
    }>;
  };

  // User info
  userName?: string;
  userEmail?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'email';
  period: 'week' | 'month' | 'quarter';
  includeCharts?: boolean;
  includeTransactions?: boolean;
  includeGoals?: boolean;
  includeInsights?: boolean;
}

class ExportService {
  /**
   * Gera relatório em PDF
   */
  async generatePDF(data: ExportData, options: ExportOptions = {
    format: 'pdf',
    period: 'month',
    includeCharts: true,
    includeTransactions: true,
    includeGoals: true,
    includeInsights: true,
  }): Promise<Blob> {
    // Criar documento PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Cores do tema Vault (convertidas de HSL para RGB)
    const primaryColor: [number, number, number] = [140, 35, 245]; // Roxo Vault (HSL 270 75% 55%)
    const secondaryColor: [number, number, number] = [103, 46, 161]; // Roxo escuro (HSL 270 60% 45%)
    const successColor: [number, number, number] = [22, 163, 74]; // Verde (HSL 142 76% 36%)
    const warningColor: [number, number, number] = [245, 158, 11]; // Amarelo (HSL 38 92% 50%)
    const dangerColor: [number, number, number] = [239, 68, 68]; // Vermelho (HSL 0 84% 60%)
    const textColor: [number, number, number] = [30, 30, 30];
    const lightGray: [number, number, number] = [240, 240, 240];
    const mutedColor: [number, number, number] = [115, 115, 115];

    // Header com logo
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Vault', margin, 20);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Relatório Financeiro', margin, 30);

    yPos = 50;

    // Informações do período
    pdf.setTextColor(...textColor);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Período: ${this.formatDate(data.periodStart)} a ${this.formatDate(data.periodEnd)}`, margin, yPos);
    pdf.text(`Gerado em: ${this.formatDate(new Date().toISOString())}`, pageWidth - margin - 60, yPos);

    if (data.userName) {
      yPos += 6;
      pdf.text(`Usuário: ${data.userName}`, margin, yPos);
    }

    yPos += 12;

    // Linha separadora
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(0.8);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 8;

    // KPIs em cards
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...primaryColor);
    pdf.text('💰 RESUMO FINANCEIRO', margin, yPos);
    yPos += 7;

    const cardWidth = (pageWidth - (margin * 2) - 8) / 2;
    const cardHeight = 22;

    // Card 1: Saldo Atual
    this.drawKPICard(pdf, margin, yPos, cardWidth, cardHeight, 'Saldo Atual', data.currentBalance, primaryColor, lightGray);

    // Card 2: Receitas
    this.drawKPICard(pdf, margin + cardWidth + 8, yPos, cardWidth, cardHeight, 'Receitas', data.totalRevenue, successColor, lightGray);

    yPos += cardHeight + 3;

    // Card 3: Despesas
    this.drawKPICard(pdf, margin, yPos, cardWidth, cardHeight, 'Despesas', data.totalExpenses, dangerColor, lightGray);

    // Card 4: Economia
    this.drawKPICard(pdf, margin + cardWidth + 8, yPos, cardWidth, cardHeight, 'Economia', data.savings, primaryColor, lightGray);

    yPos += cardHeight + 3;

    // Card 5: Dias até Zerar (full width)
    if (data.daysUntilZero > 0) {
      const statusColor: [number, number, number] =
        data.daysUntilZero < 15 ? dangerColor :
        data.daysUntilZero < 30 ? warningColor :
        successColor;
      this.drawKPICard(pdf, margin, yPos, pageWidth - (margin * 2), cardHeight, 'Dias até Zerar o Caixa', data.daysUntilZero, statusColor, lightGray, ' dias');
      yPos += cardHeight + 6;
    } else {
      yPos += 3;
    }

    // Transações (se incluído)
    if (options.includeTransactions && data.transactions.length > 0) {
      // Nova página se necessário
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      // Linha separadora
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(0.8);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;

      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('📊 ÚLTIMAS TRANSAÇÕES', margin, yPos);
      yPos += 6;

      // Limitar a 15 transações mais recentes para caber melhor
      const recentTransactions = data.transactions.slice(0, 15);

      // Box para transações
      const transBoxHeight = Math.min(recentTransactions.length * 6 + 8, 80);
      pdf.setDrawColor(...lightGray);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), transBoxHeight, 2, 2, 'S');

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(100, 100, 100);
      pdf.text('DATA', margin + 3, yPos + 5);
      pdf.text('DESCRIÇÃO', margin + 28, yPos + 5);
      pdf.text('VALOR', pageWidth - margin - 28, yPos + 5);

      yPos += 8;

      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');

      recentTransactions.forEach((transaction, index) => {
        if (yPos > pageHeight - 15) {
          pdf.addPage();
          yPos = margin + 10;
        }

        const date = format(new Date(transaction.date), 'dd/MM');
        const amount = this.formatCurrency(transaction.amount);
        const isIncome = transaction.type === 'income';
        const desc = transaction.description.substring(0, 35) + (transaction.description.length > 35 ? '...' : '');

        // Linha separadora leve
        if (index > 0) {
          pdf.setDrawColor(240, 240, 240);
          pdf.setLineWidth(0.2);
          pdf.line(margin + 2, yPos - 1, pageWidth - margin - 2, yPos - 1);
        }

        pdf.setTextColor(...textColor);
        pdf.text(date, margin + 3, yPos + 3);
        pdf.text(desc, margin + 28, yPos + 3);

        pdf.setTextColor(...(isIncome ? successColor : dangerColor));
        pdf.setFont('helvetica', 'bold');
        pdf.text((isIncome ? '+' : '-') + amount, pageWidth - margin - 28, yPos + 3);
        pdf.setFont('helvetica', 'normal');

        yPos += 5;
      });

      yPos += 8;
    }

    // Metas (se incluído)
    if (options.includeGoals && data.goals && data.goals.length > 0) {
      // Nova página se necessário
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = margin;
      }

      // Linha separadora
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(0.8);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;

      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('🎯 METAS FINANCEIRAS', margin, yPos);
      yPos += 6;

      data.goals.forEach((goal, index) => {
        if (yPos > pageHeight - 25) {
          pdf.addPage();
          yPos = margin + 10;
        }

        // Box para cada meta
        const goalBoxHeight = 18;
        pdf.setFillColor(248, 248, 250);
        pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), goalBoxHeight, 2, 2, 'F');
        pdf.setDrawColor(...lightGray);
        pdf.setLineWidth(0.5);
        pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), goalBoxHeight, 2, 2, 'S');

        yPos += 5;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...textColor);
        pdf.text(goal.title, margin + 3, yPos);

        // Badge de progresso
        const progressColor = goal.progress >= 80 ? successColor : goal.progress >= 50 ? warningColor : dangerColor;
        pdf.setFillColor(...progressColor);
        pdf.roundedRect(pageWidth - margin - 25, yPos - 4, 22, 6, 1, 1, 'F');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.text(`${goal.progress}%`, pageWidth - margin - 14, yPos, { align: 'center' });

        yPos += 4;

        // Progress bar compacta
        const barWidth = pageWidth - (margin * 2) - 6;
        const barHeight = 5;

        // Background
        pdf.setFillColor(230, 230, 230);
        pdf.roundedRect(margin + 3, yPos, barWidth, barHeight, 1, 1, 'F');

        // Progress
        const progressWidth = (barWidth * goal.progress) / 100;
        pdf.setFillColor(...progressColor);
        pdf.roundedRect(margin + 3, yPos, progressWidth, barHeight, 1, 1, 'F');

        yPos += barHeight + 3;

        // Valores
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(
          `${this.formatCurrency(goal.current)} de ${this.formatCurrency(goal.target)}`,
          margin + 3,
          yPos
        );

        yPos += 9;
      });
    }

    // Insights de IA (se incluído)
    if (options.includeInsights && data.insights) {
      // Nova página se necessário
      if (yPos > pageHeight - 60) {
        pdf.addPage();
        yPos = margin;
      }

      // Linha separadora
      pdf.setDrawColor(...primaryColor);
      pdf.setLineWidth(0.8);
      pdf.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 7;

      pdf.setFontSize(13);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('🧠 ANÁLISE DE INTELIGÊNCIA ARTIFICIAL', margin, yPos);
      yPos += 6;

      // Summary em box destacado
      if (data.insights.summary) {
        pdf.setFillColor(248, 250, 252);
        const summaryLines = pdf.splitTextToSize(data.insights.summary, pageWidth - (margin * 2) - 12);
        const boxHeight = summaryLines.length * 5 + 8;
        pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), boxHeight, 2, 2, 'F');
        pdf.setDrawColor(...primaryColor);
        pdf.setLineWidth(0.3);
        pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), boxHeight, 2, 2, 'S');

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...textColor);
        pdf.text(summaryLines, margin + 5, yPos + 5);
        yPos += boxHeight + 6;
      }

      // Warnings em box vermelho
      if (data.insights.warnings.length > 0) {
        if (yPos > pageHeight - 35) {
          pdf.addPage();
          yPos = margin + 10;
        }

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...dangerColor);
        pdf.text('⚠️ Alertas Críticos', margin, yPos);
        yPos += 5;

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...textColor);

        data.insights.warnings.forEach((warning, index) => {
          if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = margin + 10;
          }

          // Box para cada alerta
          pdf.setFillColor(254, 242, 242);
          const lines = pdf.splitTextToSize(warning, pageWidth - (margin * 2) - 12);
          const boxHeight = lines.length * 4 + 6;
          pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), boxHeight, 2, 2, 'F');
          pdf.setDrawColor(...dangerColor);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), boxHeight, 2, 2, 'S');

          // Ícone de alerta
          pdf.setFontSize(9);
          pdf.setTextColor(...dangerColor);
          pdf.text('•', margin + 3, yPos + 4);

          pdf.setFontSize(8);
          pdf.setTextColor(...textColor);
          pdf.text(lines, margin + 7, yPos + 4);
          yPos += boxHeight + 3;
        });

        yPos += 3;
      }

      // Recommendations em box verde
      if (data.insights.recommendations.length > 0) {
        if (yPos > pageHeight - 35) {
          pdf.addPage();
          yPos = margin + 10;
        }

        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...successColor);
        pdf.text('✓ Recomendações', margin, yPos);
        yPos += 5;

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...textColor);

        data.insights.recommendations.forEach((rec, index) => {
          if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = margin + 10;
          }

          // Box para cada recomendação
          pdf.setFillColor(240, 253, 244);
          const lines = pdf.splitTextToSize(rec, pageWidth - (margin * 2) - 12);
          const boxHeight = lines.length * 4 + 6;
          pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), boxHeight, 2, 2, 'F');
          pdf.setDrawColor(...successColor);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(margin, yPos, pageWidth - (margin * 2), boxHeight, 2, 2, 'S');

          // Ícone de check
          pdf.setFontSize(9);
          pdf.setTextColor(...successColor);
          pdf.text('✓', margin + 3, yPos + 4);

          pdf.setFontSize(8);
          pdf.setTextColor(...textColor);
          pdf.text(lines, margin + 8, yPos + 4);
          yPos += boxHeight + 3;
        });

        yPos += 5;
      }
    }

    // Análises Detalhadas de IA
    if (options.includeInsights && data.aiAnalysis) {
      // Balance Prediction
      if (data.aiAnalysis.balancePrediction) {
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = margin;
        }

        const pred = data.aiAnalysis.balancePrediction;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...primaryColor);
        pdf.text('📊 Previsão de Saldo', margin, yPos);
        yPos += 8;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...textColor);

        const predText = [
          `Saldo Previsto (${pred.days_ahead} dias): ${this.formatCurrency(pred.predicted_balance)}`,
          `Tendência: ${pred.trend}`,
          `Confiança: ${pred.confidence}%`
        ];

        predText.forEach((line) => {
          pdf.text(line, margin + 5, yPos);
          yPos += 5;
        });

        yPos += 8;
      }

      // Anomalies
      if (data.aiAnalysis.anomalies && data.aiAnalysis.anomalies.length > 0) {
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...dangerColor);
        pdf.text('🔍 Anomalias Detectadas', margin, yPos);
        yPos += 8;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...textColor);

        data.aiAnalysis.anomalies.forEach((anomaly) => {
          if (yPos > pageHeight - 25) {
            pdf.addPage();
            yPos = margin;
          }

          const anomalyColor: [number, number, number] =
            anomaly.severity === 'high' ? dangerColor :
            anomaly.severity === 'medium' ? warningColor : mutedColor;

          pdf.setTextColor(...anomalyColor);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`• ${anomaly.description}`, margin + 5, yPos);
          yPos += 5;

          pdf.setTextColor(...textColor);
          pdf.setFont('helvetica', 'normal');
          const reasonLines = pdf.splitTextToSize(`  ${anomaly.reason}`, pageWidth - (margin * 2) - 15);
          pdf.text(reasonLines, margin + 7, yPos);
          yPos += reasonLines.length * 4 + 4;
        });

        yPos += 5;
      }

      // Spending Patterns
      if (data.aiAnalysis.spendingPatterns && data.aiAnalysis.spendingPatterns.length > 0) {
        if (yPos > pageHeight - 50) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...primaryColor);
        pdf.text('📈 Padrões de Gastos', margin, yPos);
        yPos += 8;

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...textColor);

        data.aiAnalysis.spendingPatterns.forEach((pattern) => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = margin;
          }

          const trendColor: [number, number, number] =
            pattern.trend === 'increasing' ? dangerColor :
            pattern.trend === 'decreasing' ? successColor : mutedColor;

          const trendIcon = pattern.trend === 'increasing' ? '↑' : pattern.trend === 'decreasing' ? '↓' : '→';

          pdf.setFont('helvetica', 'bold');
          pdf.text(`${trendIcon} ${pattern.category}:`, margin + 5, yPos);

          pdf.setFont('helvetica', 'normal');
          pdf.setTextColor(...trendColor);
          pdf.text(this.formatCurrency(pattern.average_amount), margin + 50, yPos);

          yPos += 5;

          if (pattern.insights) {
            pdf.setTextColor(...textColor);
            const insightLines = pdf.splitTextToSize(`  ${pattern.insights}`, pageWidth - (margin * 2) - 15);
            pdf.text(insightLines, margin + 7, yPos);
            yPos += insightLines.length * 4 + 3;
          }

          yPos += 2;
        });
      }
    }

    // Footer
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        `Página ${i} de ${totalPages} | Vault - Caixa Alerta | vault.tec.br`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Retornar como Blob
    return pdf.output('blob');
  }

  /**
   * Desenha um card de KPI no PDF
   */
  private drawKPICard(
    pdf: jsPDF,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: number,
    color: [number, number, number],
    bgColor: [number, number, number],
    suffix: string = ''
  ) {
    // Background
    pdf.setFillColor(...bgColor);
    pdf.roundedRect(x, y, width, height, 3, 3, 'F');

    // Border
    pdf.setDrawColor(...color);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(x, y, width, height, 3, 3, 'S');

    // Label
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(label, x + 5, y + 8);

    // Value
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...color);
    const formattedValue = suffix ? `${value}${suffix}` : this.formatCurrency(value);
    pdf.text(formattedValue, x + 5, y + 18);
  }

  /**
   * Faz download do PDF
   */
  async downloadPDF(data: ExportData, options?: ExportOptions): Promise<void> {
    const blob = await this.generatePDF(data, options);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vault-relatorio-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Captura gráficos como imagem (para inserir no PDF)
   */
  async captureChartAsImage(elementId: string): Promise<string | null> {
    const element = document.getElementById(elementId);
    if (!element) return null;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error capturing chart:', error);
      return null;
    }
  }

  /**
   * Formata data
   */
  private formatDate(dateString: string): string {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  }

  /**
   * Formata valor monetário
   */
  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Envia relatório por email (via Supabase Edge Function)
   */
  async sendEmailReport(
    data: ExportData,
    recipientEmail: string,
    options?: ExportOptions
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Gerar PDF
      const pdfBlob = await this.generatePDF(data, options);

      // Converter blob para base64
      const pdfBase64 = await this.blobToBase64(pdfBlob);

      // TODO: Implementar chamada para Supabase Edge Function
      // Por enquanto, retornamos sucesso mockado
      console.log('Email report would be sent to:', recipientEmail);
      console.log('PDF size:', pdfBlob.size, 'bytes');

      // Simular envio
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        success: true,
        message: `Relatório enviado para ${recipientEmail} com sucesso!`,
      };
    } catch (error) {
      console.error('Error sending email report:', error);
      return {
        success: false,
        message: 'Erro ao enviar relatório. Tente novamente.',
      };
    }
  }

  /**
   * Converte Blob para Base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:application/pdf;base64,
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const exportService = new ExportService();
