import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { addDays, subDays, subMonths, format } from 'date-fns';

export interface LedgerRAGQuery {
  question: string;
  companyId: string;
  storeId?: string;
  projectId?: string;
  contractId?: string;
  context?: {
    role: string;
    userId: string;
    planLevel: 'LITE' | 'STANDARD' | 'PRO';
  };
}

export interface LedgerRAGResponse {
  answer: string;
  confidence: number;
  sources: Array<{
    type: 'project' | 'contract' | 'invoice' | 'payment' | 'expense';
    id: string;
    title: string;
    excerpt: string;
    relevanceScore: number;
  }>;
  suggestions: string[];
  relatedQueries: string[];
}

@Injectable()
export class LedgerRAGService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 工事台帳関連の質問応答
   */
  async queryLedger(query: LedgerRAGQuery): Promise<LedgerRAGResponse> {
    const intent = await this.classifyIntent(query.question);
    const contextData = await this.gatherRelevantContext(query, intent);
    const answer = await this.generateAnswer(query.question, intent, contextData);
    
    return {
      answer: answer.text,
      confidence: answer.confidence,
      sources: contextData.sources,
      suggestions: this.generateSuggestions(intent, query.context?.planLevel),
      relatedQueries: this.getRelatedQueries(intent),
    };
  }

  /**
   * 質問の意図分類
   */
  private async classifyIntent(question: string): Promise<string> {
    const questionLower = question.toLowerCase();

    // プロジェクト進捗関連
    if (questionLower.includes('進捗') || questionLower.includes('進度') || questionLower.includes('スケジュール')) {
      return 'progress_inquiry';
    }

    // 予算・コスト関連
    if (questionLower.includes('予算') || questionLower.includes('コスト') || questionLower.includes('費用') || questionLower.includes('原価')) {
      return 'budget_inquiry';
    }

    // 請求・入金関連
    if (questionLower.includes('請求') || questionLower.includes('入金') || questionLower.includes('支払') || questionLower.includes('売掛')) {
      return 'billing_inquiry';
    }

    // 契約関連
    if (questionLower.includes('契約') || questionLower.includes('変更') || questionLower.includes('追加工事')) {
      return 'contract_inquiry';
    }

    // 利益率・分析関連
    if (questionLower.includes('利益') || questionLower.includes('収益') || questionLower.includes('分析') || questionLower.includes('比較')) {
      return 'analysis_inquiry';
    }

    // 期限・スケジュール関連
    if (questionLower.includes('期限') || questionLower.includes('完了') || questionLower.includes('予定')) {
      return 'deadline_inquiry';
    }

    // トレンド・傾向関連
    if (questionLower.includes('傾向') || questionLower.includes('トレンド') || questionLower.includes('推移')) {
      return 'trend_inquiry';
    }

    return 'general_inquiry';
  }

  /**
   * 関連コンテキストデータの収集
   */
  private async gatherRelevantContext(query: LedgerRAGQuery, intent: string): Promise<{
    projects: any[];
    contracts: any[];
    invoices: any[];
    payments: any[];
    expenses: any[];
    sources: any[];
  }> {
    const { companyId, storeId, projectId, contractId } = query;
    const context = { projects: [], contracts: [], invoices: [], payments: [], expenses: [], sources: [] };

    switch (intent) {
      case 'progress_inquiry':
        // プロジェクト進捗データ
        context.projects = await this.prisma.project.findMany({
          where: {
            companyId,
            ...(storeId && { storeId }),
            ...(projectId && { id: projectId }),
            status: { in: ['planning', 'in_progress'] },
          },
          include: {
            tasks: {
              include: { assignedUser: true },
            },
            contract: true,
            progressApprovals: {
              orderBy: { approvedAt: 'desc' },
              take: 3,
            },
          },
          take: 10,
        });

        context.sources = context.projects.map(project => ({
          type: 'project',
          id: project.id,
          title: project.name,
          excerpt: `進捗率: ${this.calculateProjectProgress(project)}%, 予定終了: ${format(project.endDate, 'yyyy/MM/dd')}`,
          relevanceScore: 0.9,
        }));
        break;

      case 'budget_inquiry':
        // プロジェクト予算・実績データ
        context.projects = await this.prisma.project.findMany({
          where: {
            companyId,
            ...(storeId && { storeId }),
            ...(projectId && { id: projectId }),
          },
          include: {
            contract: true,
            expenses: {
              include: { category: true },
            },
            budgetRevisions: {
              orderBy: { createdAt: 'desc' },
            },
          },
          take: 10,
        });

        context.sources = context.projects.map(project => {
          const totalExpenses = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
          const budget = project.budget || project.contract?.amount || 0;
          const variance = budget - totalExpenses;
          
          return {
            type: 'project',
            id: project.id,
            title: project.name,
            excerpt: `予算: ¥${budget.toLocaleString()}, 実績: ¥${totalExpenses.toLocaleString()}, 差異: ¥${variance.toLocaleString()}`,
            relevanceScore: 0.95,
          };
        });
        break;

      case 'billing_inquiry':
        // 請求・入金データ
        context.invoices = await this.prisma.invoice.findMany({
          where: {
            companyId,
            ...(storeId && { storeId }),
            ...(contractId && { contractId }),
            createdAt: {
              gte: subMonths(new Date(), 6),
            },
          },
          include: {
            contract: true,
            customer: true,
            payments: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

        context.sources = context.invoices.map(invoice => {
          const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
          const remaining = invoice.amount - paidAmount;
          
          return {
            type: 'invoice',
            id: invoice.id,
            title: `請求書 ${invoice.invoiceNumber}`,
            excerpt: `金額: ¥${invoice.amount.toLocaleString()}, 未収: ¥${remaining.toLocaleString()}, 期日: ${format(invoice.dueDate, 'yyyy/MM/dd')}`,
            relevanceScore: 0.9,
          };
        });
        break;

      case 'contract_inquiry':
        // 契約関連データ
        context.contracts = await this.prisma.contract.findMany({
          where: {
            companyId,
            ...(storeId && { storeId }),
            ...(contractId && { id: contractId }),
          },
          include: {
            customer: true,
            project: true,
            contractHistory: {
              orderBy: { createdAt: 'desc' },
            },
            budgetRevisions: {
              orderBy: { createdAt: 'desc' },
            },
          },
          take: 10,
        });

        context.sources = context.contracts.map(contract => ({
          type: 'contract',
          id: contract.id,
          title: `契約 ${contract.contractNumber}`,
          excerpt: `顧客: ${contract.customer.name}, 金額: ¥${contract.amount.toLocaleString()}, 変更回数: ${contract.contractHistory.length}`,
          relevanceScore: 0.9,
        }));
        break;

      case 'analysis_inquiry':
        // 分析用の複合データ
        context.projects = await this.prisma.project.findMany({
          where: {
            companyId,
            ...(storeId && { storeId }),
            status: { in: ['completed', 'in_progress'] },
          },
          include: {
            contract: true,
            expenses: true,
          },
          take: 20,
        });

        context.sources = context.projects.map(project => {
          const revenue = project.contract?.amount || 0;
          const costs = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
          const margin = revenue - costs;
          const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;
          
          return {
            type: 'project',
            id: project.id,
            title: project.name,
            excerpt: `売上: ¥${revenue.toLocaleString()}, 原価: ¥${costs.toLocaleString()}, 利益率: ${marginPercent.toFixed(1)}%`,
            relevanceScore: 0.85,
          };
        });
        break;

      default:
        // 一般的な問い合わせ用のデータ
        context.projects = await this.prisma.project.findMany({
          where: {
            companyId,
            ...(storeId && { storeId }),
            ...(projectId && { id: projectId }),
          },
          include: {
            contract: true,
            tasks: true,
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        });
        break;
    }

    return context;
  }

  /**
   * 回答生成
   */
  private async generateAnswer(question: string, intent: string, contextData: any): Promise<{
    text: string;
    confidence: number;
  }> {
    let answer = '';
    let confidence = 0.8;

    switch (intent) {
      case 'progress_inquiry':
        answer = this.generateProgressAnswer(contextData.projects);
        confidence = 0.9;
        break;

      case 'budget_inquiry':
        answer = this.generateBudgetAnswer(contextData.projects);
        confidence = 0.95;
        break;

      case 'billing_inquiry':
        answer = this.generateBillingAnswer(contextData.invoices);
        confidence = 0.9;
        break;

      case 'contract_inquiry':
        answer = this.generateContractAnswer(contextData.contracts);
        confidence = 0.85;
        break;

      case 'analysis_inquiry':
        answer = this.generateAnalysisAnswer(contextData.projects);
        confidence = 0.8;
        break;

      default:
        answer = this.generateGeneralAnswer(contextData);
        confidence = 0.7;
        break;
    }

    return { text: answer, confidence };
  }

  /**
   * 進捗関連の回答生成
   */
  private generateProgressAnswer(projects: any[]): string {
    if (projects.length === 0) {
      return '現在進行中のプロジェクトが見つかりませんでした。';
    }

    const progressSummary = projects.map(project => {
      const progress = this.calculateProjectProgress(project);
      const isDelayed = new Date() > project.endDate && project.status !== 'completed';
      
      return `**${project.name}**\n` +
             `- 進捗率: ${progress}%\n` +
             `- 予定完了日: ${format(project.endDate, 'yyyy年M月d日')}\n` +
             `- ステータス: ${isDelayed ? '⚠️ 遅延中' : '✅ 順調'}\n`;
    });

    const onTimeProjects = projects.filter(p => new Date() <= p.endDate || p.status === 'completed').length;
    const delayedProjects = projects.length - onTimeProjects;

    return `## プロジェクト進捗状況\n\n` +
           `📊 **全体サマリー**\n` +
           `- 総プロジェクト数: ${projects.length}件\n` +
           `- 順調なプロジェクト: ${onTimeProjects}件\n` +
           `- 遅延プロジェクト: ${delayedProjects}件\n\n` +
           `📋 **詳細**\n` +
           progressSummary.join('\n');
  }

  /**
   * 予算関連の回答生成
   */
  private generateBudgetAnswer(projects: any[]): string {
    if (projects.length === 0) {
      return '予算データが見つかりませんでした。';
    }

    let totalBudget = 0;
    let totalSpent = 0;
    const projectSummary = [];

    projects.forEach(project => {
      const budget = project.budget || project.contract?.amount || 0;
      const spent = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const variance = budget - spent;
      const variancePercent = budget > 0 ? ((variance / budget) * 100) : 0;

      totalBudget += budget;
      totalSpent += spent;

      projectSummary.push(
        `**${project.name}**\n` +
        `- 予算: ¥${budget.toLocaleString()}\n` +
        `- 実績: ¥${spent.toLocaleString()}\n` +
        `- 差異: ¥${variance.toLocaleString()} (${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%)\n`
      );
    });

    const totalVariance = totalBudget - totalSpent;
    const totalVariancePercent = totalBudget > 0 ? ((totalVariance / totalBudget) * 100) : 0;

    return `## 予算状況\n\n` +
           `💰 **全体サマリー**\n` +
           `- 総予算: ¥${totalBudget.toLocaleString()}\n` +
           `- 総実績: ¥${totalSpent.toLocaleString()}\n` +
           `- 総差異: ¥${totalVariance.toLocaleString()} (${totalVariancePercent > 0 ? '+' : ''}${totalVariancePercent.toFixed(1)}%)\n\n` +
           `📊 **プロジェクト別詳細**\n` +
           projectSummary.join('\n');
  }

  /**
   * 請求関連の回答生成
   */
  private generateBillingAnswer(invoices: any[]): string {
    if (invoices.length === 0) {
      return '請求書データが見つかりませんでした。';
    }

    let totalAmount = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    const today = new Date();

    const invoiceSummary = invoices.slice(0, 5).map(invoice => {
      const paidAmount = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const remaining = invoice.amount - paidAmount;
      const isOverdue = invoice.dueDate < today && remaining > 0;

      totalAmount += invoice.amount;
      totalPaid += paidAmount;
      if (isOverdue) overdueCount++;

      return `**${invoice.invoiceNumber}**\n` +
             `- 顧客: ${invoice.customer.name}\n` +
             `- 金額: ¥${invoice.amount.toLocaleString()}\n` +
             `- 未収: ¥${remaining.toLocaleString()}\n` +
             `- 期日: ${format(invoice.dueDate, 'yyyy年M月d日')} ${isOverdue ? '⚠️ 延滞' : ''}\n`;
    });

    const collectionRate = totalAmount > 0 ? ((totalPaid / totalAmount) * 100) : 0;

    return `## 請求・入金状況\n\n` +
           `💳 **サマリー**\n` +
           `- 総請求額: ¥${totalAmount.toLocaleString()}\n` +
           `- 回収済み: ¥${totalPaid.toLocaleString()}\n` +
           `- 未収金: ¥${(totalAmount - totalPaid).toLocaleString()}\n` +
           `- 回収率: ${collectionRate.toFixed(1)}%\n` +
           `- 延滞件数: ${overdueCount}件\n\n` +
           `📋 **直近の請求書**\n` +
           invoiceSummary.join('\n');
  }

  /**
   * 契約関連の回答生成
   */
  private generateContractAnswer(contracts: any[]): string {
    if (contracts.length === 0) {
      return '契約データが見つかりませんでした。';
    }

    const contractSummary = contracts.map(contract => {
      const changesCount = contract.contractHistory.length;
      const budgetRevisions = contract.budgetRevisions.length;
      
      return `**${contract.contractNumber}**\n` +
             `- 顧客: ${contract.customer.name}\n` +
             `- 契約金額: ¥${contract.amount.toLocaleString()}\n` +
             `- 契約変更: ${changesCount}回\n` +
             `- 予算変更: ${budgetRevisions}回\n` +
             `- 状況: ${contract.status}\n`;
    });

    const totalAmount = contracts.reduce((sum, contract) => sum + contract.amount, 0);
    const totalChanges = contracts.reduce((sum, contract) => sum + contract.contractHistory.length, 0);

    return `## 契約状況\n\n` +
           `📋 **サマリー**\n` +
           `- 契約数: ${contracts.length}件\n` +
           `- 総契約金額: ¥${totalAmount.toLocaleString()}\n` +
           `- 総変更回数: ${totalChanges}回\n\n` +
           `📊 **契約詳細**\n` +
           contractSummary.join('\n');
  }

  /**
   * 分析関連の回答生成
   */
  private generateAnalysisAnswer(projects: any[]): string {
    if (projects.length === 0) {
      return '分析用のデータが見つかりませんでした。';
    }

    const profitableProjects = [];
    const unprofitableProjects = [];
    let totalRevenue = 0;
    let totalCosts = 0;

    projects.forEach(project => {
      const revenue = project.contract?.amount || 0;
      const costs = project.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const margin = revenue - costs;
      const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

      totalRevenue += revenue;
      totalCosts += costs;

      if (marginPercent >= 15) {
        profitableProjects.push({ name: project.name, marginPercent });
      } else if (marginPercent < 5) {
        unprofitableProjects.push({ name: project.name, marginPercent });
      }
    });

    const overallMargin = totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0;

    return `## 収益性分析\n\n` +
           `📈 **全体指標**\n` +
           `- 総売上: ¥${totalRevenue.toLocaleString()}\n` +
           `- 総原価: ¥${totalCosts.toLocaleString()}\n` +
           `- 全体利益率: ${overallMargin.toFixed(1)}%\n\n` +
           `✅ **高収益プロジェクト (15%以上)**\n` +
           profitableProjects.map(p => `- ${p.name}: ${p.marginPercent.toFixed(1)}%`).join('\n') + '\n\n' +
           `⚠️ **低収益プロジェクト (5%未満)**\n` +
           unprofitableProjects.map(p => `- ${p.name}: ${p.marginPercent.toFixed(1)}%`).join('\n');
  }

  /**
   * 一般的な回答生成
   */
  private generateGeneralAnswer(contextData: any): string {
    return `申し訳ございませんが、お尋ねの内容について具体的な回答を提供できませんでした。\n\n` +
           `以下の内容についてお答えできます：\n` +
           `- プロジェクトの進捗状況\n` +
           `- 予算と実績の比較\n` +
           `- 請求・入金状況\n` +
           `- 契約変更履歴\n` +
           `- 収益性分析\n\n` +
           `より具体的にご質問いただければ、詳細な情報を提供いたします。`;
  }

  /**
   * プロジェクト進捗率計算
   */
  private calculateProjectProgress(project: any): number {
    if (!project.tasks || project.tasks.length === 0) return 0;
    
    const completedTasks = project.tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  }

  /**
   * 提案生成
   */
  private generateSuggestions(intent: string, planLevel?: string): string[] {
    const baseSuggestions = {
      progress_inquiry: [
        '遅延しているタスクの詳細を確認する',
        'リソース配分を見直す',
        '顧客への進捗報告を準備する',
      ],
      budget_inquiry: [
        '予算超過の原因を分析する',
        'コスト削減の施策を検討する',
        '変更管理プロセスを確認する',
      ],
      billing_inquiry: [
        '延滞請求書のフォローアップを行う',
        'キャッシュフロー予測を更新する',
        '支払い条件を見直す',
      ],
      contract_inquiry: [
        '契約変更の影響を評価する',
        '追加工事の収益性を確認する',
        'リスク管理体制を見直す',
      ],
      analysis_inquiry: [
        '収益性の改善案を検討する',
        'ベンチマーク分析を実施する',
        'KPI監視体制を強化する',
      ],
    };

    const suggestions = baseSuggestions[intent] || [
      'より詳細なデータ分析を実施する',
      '関連部門との連携を強化する',
      '定期的なモニタリングを設定する',
    ];

    // PRO機能の提案を追加
    if (planLevel === 'PRO') {
      suggestions.push('高度な分析レポートを生成する');
      suggestions.push('自動アラート設定を活用する');
    }

    return suggestions;
  }

  /**
   * 関連クエリ生成
   */
  private getRelatedQueries(intent: string): string[] {
    const relatedQueries = {
      progress_inquiry: [
        '今月完了予定のプロジェクトは？',
        '遅延しているタスクの責任者は？',
        '来月の工事スケジュールは？',
      ],
      budget_inquiry: [
        '最も収益性の高いプロジェクトは？',
        '予算超過の主な要因は？',
        '今期の利益目標達成見込みは？',
      ],
      billing_inquiry: [
        '未回収の売掛金はいくら？',
        '今月の入金予定は？',
        '支払い遅延が多い顧客は？',
      ],
      contract_inquiry: [
        '今年の契約件数は？',
        '平均的な契約変更回数は？',
        '大型契約の進捗は？',
      ],
      analysis_inquiry: [
        '部門別の収益性は？',
        '季節変動の傾向は？',
        '競合他社との比較は？',
      ],
    };

    return relatedQueries[intent] || [
      'プロジェクト全体の状況は？',
      '今月の売上予測は？',
      '顧客満足度の状況は？',
    ];
  }
}