import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { addDays, subDays, subMonths, subWeeks, format, isAfter, isBefore } from 'date-fns';

export interface AftercareRAGQuery {
  question: string;
  companyId: string;
  storeId?: string;
  customerId?: string;
  projectId?: string;
  context?: {
    role: string;
    userId: string;
  };
}

export interface AftercareRAGResponse {
  answer: string;
  confidence: number;
  sources: Array<{
    type: 'inspection' | 'defect' | 'warranty' | 'maintenance' | 'satisfaction';
    id: string;
    title: string;
    excerpt: string;
    relevanceScore: number;
  }>;
  suggestions: string[];
  relatedQueries: string[];
  urgentActions?: Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: Date;
  }>;
}

@Injectable()
export class AftercareRAGService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * アフターケア関連の質問応答
   */
  async queryAftercare(query: AftercareRAGQuery): Promise<AftercareRAGResponse> {
    const intent = await this.classifyIntent(query.question);
    const contextData = await this.gatherRelevantContext(query, intent);
    const answer = await this.generateAnswer(query.question, intent, contextData);
    const urgentActions = await this.identifyUrgentActions(contextData, intent);
    
    return {
      answer: answer.text,
      confidence: answer.confidence,
      sources: contextData.sources,
      suggestions: this.generateSuggestions(intent, contextData),
      relatedQueries: this.getRelatedQueries(intent),
      urgentActions,
    };
  }

  /**
   * 質問の意図分類
   */
  private async classifyIntent(question: string): Promise<string> {
    const questionLower = question.toLowerCase();

    // 点検関連
    if (questionLower.includes('点検') || questionLower.includes('検査') || questionLower.includes('チェック')) {
      return 'inspection_inquiry';
    }

    // 不具合・トラブル関連
    if (questionLower.includes('不具合') || questionLower.includes('トラブル') || questionLower.includes('故障') || questionLower.includes('問題')) {
      return 'defect_inquiry';
    }

    // 保証関連
    if (questionLower.includes('保証') || questionLower.includes('保守') || questionLower.includes('warranty')) {
      return 'warranty_inquiry';
    }

    // メンテナンス関連
    if (questionLower.includes('メンテナンス') || questionLower.includes('保守') || questionLower.includes('維持管理')) {
      return 'maintenance_inquiry';
    }

    // 顧客満足度関連
    if (questionLower.includes('満足度') || questionLower.includes('評価') || questionLower.includes('feedback') || questionLower.includes('nps')) {
      return 'satisfaction_inquiry';
    }

    // スケジュール・期限関連
    if (questionLower.includes('スケジュール') || questionLower.includes('予定') || questionLower.includes('期限') || questionLower.includes('次回')) {
      return 'schedule_inquiry';
    }

    // 顧客対応・履歴関連
    if (questionLower.includes('履歴') || questionLower.includes('対応') || questionLower.includes('コンタクト') || questionLower.includes('連絡')) {
      return 'customer_history_inquiry';
    }

    // 統計・分析関連
    if (questionLower.includes('統計') || questionLower.includes('分析') || questionLower.includes('傾向') || questionLower.includes('トレンド')) {
      return 'analytics_inquiry';
    }

    return 'general_inquiry';
  }

  /**
   * 関連コンテキストデータの収集
   */
  private async gatherRelevantContext(query: AftercareRAGQuery, intent: string): Promise<{
    inspections: any[];
    defects: any[];
    warranties: any[];
    maintenanceContracts: any[];
    satisfactionSurveys: any[];
    sources: any[];
  }> {
    const { companyId, storeId, customerId, projectId } = query;
    const context = { 
      inspections: [], 
      defects: [], 
      warranties: [], 
      maintenanceContracts: [], 
      satisfactionSurveys: [], 
      sources: [] 
    };

    switch (intent) {
      case 'inspection_inquiry':
        // 点検スケジュールと履歴
        context.inspections = await this.prisma.afterCareSchedule.findMany({
          where: {
            companyId,
            ...(storeId && { storeId }),
            ...(customerId && { customerId }),
            ...(projectId && { projectId }),
          },
          include: {
            customer: true,
            defects: true,
            reminders: true,
          },
          orderBy: { scheduledDate: 'desc' },
          take: 20,
        });

        context.sources = context.inspections.map(inspection => ({
          type: 'inspection',
          id: inspection.id,
          title: `${inspection.inspectionType}点検`,
          excerpt: `顧客: ${inspection.customer.name}, 予定日: ${format(inspection.scheduledDate, 'yyyy/MM/dd')}, 状況: ${inspection.status}`,
          relevanceScore: 0.9,
        }));
        break;

      case 'defect_inquiry':
        // 不具合履歴
        context.defects = await this.prisma.defectCase.findMany({
          where: {
            schedule: {
              companyId,
              ...(storeId && { storeId }),
              ...(customerId && { customerId }),
              ...(projectId && { projectId }),
            },
          },
          include: {
            schedule: {
              include: { customer: true },
            },
          },
          orderBy: { identifiedAt: 'desc' },
          take: 15,
        });

        context.sources = context.defects.map(defect => ({
          type: 'defect',
          id: defect.id,
          title: `不具合: ${defect.description.substring(0, 30)}...`,
          excerpt: `深刻度: ${defect.severity}, 場所: ${defect.location || '不明'}, 状況: ${defect.status}`,
          relevanceScore: 0.95,
        }));
        break;

      case 'warranty_inquiry':
        // 保証情報
        context.warranties = await this.prisma.warrantyRecord.findMany({
          where: {
            companyId,
            ...(storeId && { storeId }),
            ...(customerId && { customerId }),
            ...(projectId && { projectId }),
          },
          include: {
            customer: true,
            claims: true,
          },
          orderBy: { endDate: 'asc' },
        });

        context.sources = context.warranties.map(warranty => ({
          type: 'warranty',
          id: warranty.id,
          title: `${warranty.warrantyType}保証`,
          excerpt: `顧客: ${warranty.customer.name}, 期限: ${format(warranty.endDate, 'yyyy/MM/dd')}, 請求回数: ${warranty.claimCount}`,
          relevanceScore: 0.9,
        }));
        break;

      case 'maintenance_inquiry':
        // メンテナンス契約と履歴
        context.maintenanceContracts = await this.prisma.maintenanceContract.findMany({
          where: {
            companyId,
            ...(storeId && { storeId }),
            ...(customerId && { customerId }),
            ...(projectId && { projectId }),
          },
          include: {
            customer: true,
            inspections: {
              orderBy: { scheduledDate: 'desc' },
              take: 5,
            },
            maintenanceRecords: {
              orderBy: { performedDate: 'desc' },
              take: 5,
            },
          },
        });

        context.sources = context.maintenanceContracts.map(contract => ({
          type: 'maintenance',
          id: contract.id,
          title: `メンテナンス契約 ${contract.contractNumber}`,
          excerpt: `顧客: ${contract.customer.name}, 期間: ${format(contract.startDate, 'yyyy/MM/dd')} - ${format(contract.endDate, 'yyyy/MM/dd')}`,
          relevanceScore: 0.85,
        }));
        break;

      case 'satisfaction_inquiry':
        // 顧客満足度調査
        context.satisfactionSurveys = await this.prisma.customerSatisfaction.findMany({
          where: {
            companyId,
            ...(storeId && { storeId }),
            ...(customerId && { customerId }),
            ...(projectId && { projectId }),
          },
          include: {
            customer: true,
          },
          orderBy: { surveyDate: 'desc' },
          take: 10,
        });

        context.sources = context.satisfactionSurveys.map(survey => ({
          type: 'satisfaction',
          id: survey.id,
          title: `満足度調査`,
          excerpt: `顧客: ${survey.customer.name}, NPS: ${survey.npsScore}, 満足度: ${survey.satisfactionScore}/5`,
          relevanceScore: 0.8,
        }));
        break;

      default:
        // 一般的な問い合わせ用の複合データ
        context.inspections = await this.prisma.afterCareSchedule.findMany({
          where: {
            companyId,
            ...(storeId && { storeId }),
            ...(customerId && { customerId }),
          },
          include: { customer: true },
          orderBy: { scheduledDate: 'desc' },
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
      case 'inspection_inquiry':
        answer = this.generateInspectionAnswer(contextData.inspections);
        confidence = 0.9;
        break;

      case 'defect_inquiry':
        answer = this.generateDefectAnswer(contextData.defects);
        confidence = 0.95;
        break;

      case 'warranty_inquiry':
        answer = this.generateWarrantyAnswer(contextData.warranties);
        confidence = 0.9;
        break;

      case 'maintenance_inquiry':
        answer = this.generateMaintenanceAnswer(contextData.maintenanceContracts);
        confidence = 0.85;
        break;

      case 'satisfaction_inquiry':
        answer = this.generateSatisfactionAnswer(contextData.satisfactionSurveys);
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
   * 点検関連の回答生成
   */
  private generateInspectionAnswer(inspections: any[]): string {
    if (inspections.length === 0) {
      return '該当する点検データが見つかりませんでした。';
    }

    const today = new Date();
    const upcoming = inspections.filter(i => isAfter(i.scheduledDate, today) && i.status !== 'completed');
    const overdue = inspections.filter(i => isBefore(i.scheduledDate, today) && i.status !== 'completed');
    const completed = inspections.filter(i => i.status === 'completed');

    const upcomingSummary = upcoming.slice(0, 5).map(inspection => 
      `- ${inspection.customer.name}: ${inspection.inspectionType}点検 (${format(inspection.scheduledDate, 'M月d日')})`
    );

    const overdueSummary = overdue.slice(0, 3).map(inspection => 
      `- ${inspection.customer.name}: ${inspection.inspectionType}点検 (${format(inspection.scheduledDate, 'M月d日')} ⚠️ 遅延)`
    );

    return `## 点検状況\n\n` +
           `📊 **サマリー**\n` +
           `- 予定点検: ${upcoming.length}件\n` +
           `- 遅延点検: ${overdue.length}件\n` +
           `- 完了点検: ${completed.length}件\n\n` +
           (upcoming.length > 0 ? `📅 **今後の点検予定**\n${upcomingSummary.join('\n')}\n\n` : '') +
           (overdue.length > 0 ? `⚠️ **遅延中の点検**\n${overdueSummary.join('\n')}\n\n` : '') +
           `💡 点検スケジュールを確認し、必要に応じて顧客へのリマインドを送信してください。`;
  }

  /**
   * 不具合関連の回答生成
   */
  private generateDefectAnswer(defects: any[]): string {
    if (defects.length === 0) {
      return '不具合の報告はありません。';
    }

    const activeDefects = defects.filter(d => d.status !== 'completed');
    const resolvedDefects = defects.filter(d => d.status === 'completed');
    
    const severityCount = {
      high: activeDefects.filter(d => d.severity === 'high').length,
      medium: activeDefects.filter(d => d.severity === 'medium').length,
      low: activeDefects.filter(d => d.severity === 'low').length,
    };

    const recentDefects = activeDefects.slice(0, 5).map(defect => 
      `**${defect.schedule.customer.name}**\n` +
      `- 内容: ${defect.description}\n` +
      `- 深刻度: ${defect.severity}\n` +
      `- 場所: ${defect.location || '不明'}\n` +
      `- 報告日: ${format(defect.identifiedAt, 'yyyy年M月d日')}\n`
    );

    return `## 不具合状況\n\n` +
           `🚨 **アクティブな不具合: ${activeDefects.length}件**\n` +
           `- 高: ${severityCount.high}件\n` +
           `- 中: ${severityCount.medium}件\n` +
           `- 低: ${severityCount.low}件\n\n` +
           `✅ **解決済み: ${resolvedDefects.length}件**\n\n` +
           (activeDefects.length > 0 ? `📋 **主な未解決不具合**\n${recentDefects.join('\n')}\n` : '') +
           `💡 高優先度の不具合については速やかに対応計画を立案してください。`;
  }

  /**
   * 保証関連の回答生成
   */
  private generateWarrantyAnswer(warranties: any[]): string {
    if (warranties.length === 0) {
      return '保証情報が見つかりませんでした。';
    }

    const today = new Date();
    const active = warranties.filter(w => w.isActive && isAfter(w.endDate, today));
    const expiringSoon = active.filter(w => isBefore(w.endDate, addDays(today, 90)));
    const expired = warranties.filter(w => isBefore(w.endDate, today));

    const expiringWarranties = expiringSoon.map(warranty => {
      const daysRemaining = Math.ceil((warranty.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return `- ${warranty.customer.name}: ${warranty.warrantyType}保証 (残り${daysRemaining}日)`;
    });

    const claimsTotal = warranties.reduce((sum, w) => sum + w.claimCount, 0);

    return `## 保証状況\n\n` +
           `📋 **保証サマリー**\n` +
           `- アクティブな保証: ${active.length}件\n` +
           `- 90日以内期限切れ: ${expiringSoon.length}件\n` +
           `- 期限切れ: ${expired.length}件\n` +
           `- 総クレーム件数: ${claimsTotal}件\n\n` +
           (expiringSoon.length > 0 ? `⚠️ **期限切れ間近の保証**\n${expiringWarranties.join('\n')}\n\n` : '') +
           `💡 期限切れ間近の保証については、顧客に更新のご案内をお送りください。`;
  }

  /**
   * メンテナンス関連の回答生成
   */
  private generateMaintenanceAnswer(contracts: any[]): string {
    if (contracts.length === 0) {
      return 'メンテナンス契約が見つかりませんでした。';
    }

    const today = new Date();
    const active = contracts.filter(c => c.status === 'active' && isAfter(c.endDate, today));
    const expiringSoon = active.filter(c => isBefore(c.endDate, addDays(today, 30)));
    
    const totalRevenue = active.reduce((sum, c) => sum + c.amount, 0);
    const recentMaintenances = contracts
      .flatMap(c => c.maintenanceRecords.map(r => ({ ...r, customer: c.customer })))
      .sort((a, b) => b.performedDate.getTime() - a.performedDate.getTime())
      .slice(0, 5);

    const maintenanceSummary = recentMaintenances.map(record => 
      `- ${record.customer.name}: ${record.description} (${format(record.performedDate, 'M月d日')})`
    );

    return `## メンテナンス契約状況\n\n` +
           `💼 **契約サマリー**\n` +
           `- アクティブ契約: ${active.length}件\n` +
           `- 更新必要(30日以内): ${expiringSoon.length}件\n` +
           `- 月間売上: ¥${totalRevenue.toLocaleString()}\n\n` +
           (recentMaintenances.length > 0 ? `🔧 **最近のメンテナンス実績**\n${maintenanceSummary.join('\n')}\n\n` : '') +
           `💡 契約更新時期の顧客には、サービス拡張のご提案も検討してください。`;
  }

  /**
   * 満足度関連の回答生成
   */
  private generateSatisfactionAnswer(surveys: any[]): string {
    if (surveys.length === 0) {
      return '満足度調査データが見つかりませんでした。';
    }

    const avgNPS = surveys.reduce((sum, s) => sum + s.npsScore, 0) / surveys.length;
    const avgSatisfaction = surveys.reduce((sum, s) => sum + s.satisfactionScore, 0) / surveys.length;
    
    const promoters = surveys.filter(s => s.npsScore >= 9).length;
    const detractors = surveys.filter(s => s.npsScore <= 6).length;
    const netNPS = ((promoters - detractors) / surveys.length) * 100;

    const highSatisfaction = surveys.filter(s => s.satisfactionScore >= 4).length;
    const lowSatisfaction = surveys.filter(s => s.satisfactionScore <= 2).length;

    const recentFeedback = surveys
      .filter(s => s.feedback)
      .slice(0, 3)
      .map(s => `**${s.customer.name}** (NPS: ${s.npsScore})\n"${s.feedback}"\n`);

    return `## 顧客満足度状況\n\n` +
           `📊 **満足度指標**\n` +
           `- 平均NPS: ${avgNPS.toFixed(1)} (Net: ${netNPS.toFixed(1)}%)\n` +
           `- 平均満足度: ${avgSatisfaction.toFixed(1)}/5\n` +
           `- 推奨者: ${promoters}人 / 批判者: ${detractors}人\n` +
           `- 高満足度(4+): ${highSatisfaction}件\n` +
           `- 低満足度(2-): ${lowSatisfaction}件\n\n` +
           (recentFeedback.length > 0 ? `💬 **最近のフィードバック**\n${recentFeedback.join('\n')}\n` : '') +
           `💡 低評価の顧客には個別のフォローアップを実施してください。`;
  }

  /**
   * 一般的な回答生成
   */
  private generateGeneralAnswer(contextData: any): string {
    return `アフターケアに関するお尋ねですね。以下の内容についてお答えできます：\n\n` +
           `🔍 **対応可能な質問**\n` +
           `- 点検スケジュールや履歴について\n` +
           `- 不具合・トラブルの状況について\n` +
           `- 保証期間や保証内容について\n` +
           `- メンテナンス契約について\n` +
           `- 顧客満足度の状況について\n\n` +
           `より具体的にご質問いただければ、詳細な情報を提供いたします。`;
  }

  /**
   * 緊急対応の特定
   */
  private async identifyUrgentActions(contextData: any, intent: string): Promise<Array<{
    action: string;
    priority: 'high' | 'medium' | 'low';
    dueDate?: Date;
  }>> {
    const urgentActions = [];
    const today = new Date();

    // 遅延している点検
    if (contextData.inspections) {
      const overdueInspections = contextData.inspections.filter(
        i => isBefore(i.scheduledDate, today) && i.status !== 'completed'
      );
      
      overdueInspections.forEach(inspection => {
        urgentActions.push({
          action: `${inspection.customer.name}の${inspection.inspectionType}点検を実施`,
          priority: 'high' as const,
          dueDate: inspection.scheduledDate,
        });
      });
    }

    // 高優先度の不具合
    if (contextData.defects) {
      const criticalDefects = contextData.defects.filter(
        d => d.severity === 'high' && d.status !== 'completed'
      );
      
      criticalDefects.forEach(defect => {
        urgentActions.push({
          action: `高優先度不具合の対応: ${defect.description.substring(0, 30)}...`,
          priority: 'high' as const,
        });
      });
    }

    // 期限切れ間近の保証
    if (contextData.warranties) {
      const expiringWarranties = contextData.warranties.filter(
        w => w.isActive && isBefore(w.endDate, addDays(today, 30))
      );
      
      expiringWarranties.forEach(warranty => {
        urgentActions.push({
          action: `${warranty.customer.name}の${warranty.warrantyType}保証更新手続き`,
          priority: 'medium' as const,
          dueDate: warranty.endDate,
        });
      });
    }

    return urgentActions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 提案生成
   */
  private generateSuggestions(intent: string, contextData: any): string[] {
    const suggestions = [];

    switch (intent) {
      case 'inspection_inquiry':
        suggestions.push('点検スケジュールの最適化を検討する');
        suggestions.push('顧客への事前リマインドを強化する');
        suggestions.push('点検チェックリストを見直す');
        break;

      case 'defect_inquiry':
        suggestions.push('不具合の根本原因分析を実施する');
        suggestions.push('予防保全計画を策定する');
        suggestions.push('品質管理体制を見直す');
        break;

      case 'warranty_inquiry':
        suggestions.push('保証延長サービスを提案する');
        suggestions.push('予防メンテナンスパッケージを提案する');
        suggestions.push('保証内容の見直しを検討する');
        break;

      case 'maintenance_inquiry':
        suggestions.push('メンテナンス契約の拡張を提案する');
        suggestions.push('定期メンテナンスの頻度を見直す');
        suggestions.push('IoTによる予防保全を検討する');
        break;

      case 'satisfaction_inquiry':
        suggestions.push('低評価顧客への個別フォローを実施する');
        suggestions.push('サービス改善計画を策定する');
        suggestions.push('定期的な満足度調査を継続する');
        break;

      default:
        suggestions.push('顧客との定期的なコミュニケーションを強化する');
        suggestions.push('サービス品質の継続的改善を図る');
        suggestions.push('データに基づく意思決定を促進する');
        break;
    }

    return suggestions;
  }

  /**
   * 関連クエリ生成
   */
  private getRelatedQueries(intent: string): string[] {
    const relatedQueries = {
      inspection_inquiry: [
        '来月の点検予定は？',
        '点検完了率はどのくらい？',
        '点検で発見される問題の傾向は？',
      ],
      defect_inquiry: [
        '最も多い不具合の種類は？',
        '不具合の解決にかかる平均時間は？',
        '季節による不具合の変動は？',
      ],
      warranty_inquiry: [
        'クレームが多い保証項目は？',
        '保証期間の延長を希望する顧客は？',
        '保証外修理の費用相場は？',
      ],
      maintenance_inquiry: [
        'メンテナンス契約の更新率は？',
        '予防保全の効果は？',
        'メンテナンス費用の適正性は？',
      ],
      satisfaction_inquiry: [
        '満足度が向上している要因は？',
        '改善が必要なサービス領域は？',
        '競合他社との満足度比較は？',
      ],
    };

    return relatedQueries[intent] || [
      'アフターケア全体の状況は？',
      '顧客満足度の傾向は？',
      'サービス改善の優先順位は？',
    ];
  }
}