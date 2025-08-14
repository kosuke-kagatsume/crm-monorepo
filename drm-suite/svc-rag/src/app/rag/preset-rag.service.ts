import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { LedgerRAGService } from './ledger-rag.service';
import { AftercareRAGService } from './aftercare-rag.service';

export interface RAGPreset {
  id: string;
  name: string;
  role: string;
  domain: 'ledger' | 'aftercare' | 'general';
  prompt: string;
  parameters: Record<string, any>;
  maskLevel: 'none' | 'basic' | 'strict';
  examples: string[];
}

export interface RAGQueryWithPreset {
  presetId: string;
  companyId: string;
  projectId?: string;
  customerId?: string;
  additionalContext?: Record<string, any>;
  userInput?: string; // プリセットに追加する質問
}

export interface RAGResponseWithCitations {
  answer: string;
  confidence: number;
  citations: Array<{
    id: string;
    type: 'document' | 'data' | 'record';
    title: string;
    excerpt: string;
    pageNumber?: number;
    recordId?: string;
    relevanceScore: number;
    url?: string;
  }>;
  suggestions: string[];
  relatedQueries: string[];
  presetUsed: string;
  maskingApplied: boolean;
}

@Injectable()
export class PresetRAGService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerRAGService: LedgerRAGService,
    private readonly aftercareRAGService: AftercareRAGService,
  ) {}

  /**
   * プリセットクエリ実行
   */
  async queryWithPreset(
    query: RAGQueryWithPreset,
    userId: string,
    userRole: string
  ): Promise<RAGResponseWithCitations> {
    const preset = await this.getPreset(query.presetId);
    if (!preset) {
      throw new Error(`プリセット ${query.presetId} が見つかりません`);
    }

    // 役職チェック
    if (preset.role !== 'all' && preset.role !== userRole) {
      throw new Error('このプリセットを使用する権限がありません');
    }

    // プリセットに基づいてクエリを構築
    const fullQuery = this.buildQueryFromPreset(preset, query);
    
    // ドメインに応じてRAGサービスを呼び出し
    let response;
    if (preset.domain === 'ledger') {
      response = await this.ledgerRAGService.queryLedger({
        question: fullQuery,
        companyId: query.companyId,
        projectId: query.projectId,
        context: {
          role: userRole,
          userId,
          planLevel: 'STANDARD', // 実際は取得する
        },
      });
    } else if (preset.domain === 'aftercare') {
      response = await this.aftercareRAGService.queryAftercare({
        question: fullQuery,
        companyId: query.companyId,
        customerId: query.customerId,
        projectId: query.projectId,
        context: {
          role: userRole,
          userId,
        },
      });
    } else {
      throw new Error('サポートされていないドメインです');
    }

    // レスポンスをcitations形式に変換
    const citations = this.convertSourcesToCitations(response.sources, preset.domain);
    
    // マスキング適用
    const maskedResponse = this.applyMasking(response.answer, preset.maskLevel, userRole);

    return {
      answer: maskedResponse,
      confidence: response.confidence,
      citations,
      suggestions: response.suggestions,
      relatedQueries: response.relatedQueries,
      presetUsed: preset.name,
      maskingApplied: preset.maskLevel !== 'none',
    };
  }

  /**
   * 役職別プリセット一覧取得
   */
  async getPresetsForRole(role: string): Promise<RAGPreset[]> {
    const presets = this.getAllPresets();
    return presets.filter(preset => preset.role === role || preset.role === 'all');
  }

  /**
   * プリセット実行履歴保存
   */
  async savePresetUsage(
    userId: string,
    companyId: string,
    presetId: string,
    query: string,
    response: RAGResponseWithCitations
  ) {
    await this.prisma.ragQueryLog.create({
      data: {
        userId,
        companyId,
        presetId,
        query,
        response: JSON.stringify(response),
        confidence: response.confidence,
        citationCount: response.citations.length,
        createdAt: new Date(),
      },
    });
  }

  // ==================== プライベートメソッド ====================

  /**
   * プリセット定義（実際はDBから取得）
   */
  private getAllPresets(): RAGPreset[] {
    return [
      // 施工管理者（foreman）用プリセット
      {
        id: 'foreman-progress-check',
        name: '進捗確認',
        role: 'construction_manager',
        domain: 'ledger',
        prompt: '担当プロジェクトの進捗状況を確認して、遅れているタスクがあれば理由と対策を教えてください。',
        parameters: { includeRisks: true, showDeadlines: true },
        maskLevel: 'none',
        examples: [
          '今月の進捗はどうですか？',
          '遅れているプロジェクトはありますか？',
          '次の工程に進める案件は？',
        ],
      },
      {
        id: 'foreman-budget-status',
        name: '予算状況確認',
        role: 'construction_manager',
        domain: 'ledger',
        prompt: '担当プロジェクトの予算執行状況を確認し、予算超過のリスクがある項目を特定してください。',
        parameters: { showVariance: true, alertThreshold: 0.9 },
        maskLevel: 'basic',
        examples: [
          '予算超過が心配な案件は？',
          'コスト管理で注意すべき点は？',
          '追加工事の影響は？',
        ],
      },
      {
        id: 'foreman-safety-check',
        name: '安全管理確認',
        role: 'construction_manager',
        domain: 'ledger',
        prompt: '現場の安全管理状況を確認し、リスクの高い作業や改善が必要な箇所を教えてください。',
        parameters: { includeSafetyMetrics: true },
        maskLevel: 'none',
        examples: [
          '安全上の懸念事項は？',
          'ヒヤリハット報告の傾向は？',
          '安全対策の効果は？',
        ],
      },

      // 事務（clerk）用プリセット
      {
        id: 'clerk-customer-status',
        name: '顧客対応状況',
        role: 'office_manager',
        domain: 'general',
        prompt: '未対応の顧客問い合わせや緊急対応が必要な案件を確認し、優先順位を教えてください。',
        parameters: { includeSLA: true, priorityFilter: 'high' },
        maskLevel: 'basic',
        examples: [
          '急ぎの対応が必要な顧客は？',
          '問い合わせの対応状況は？',
          '今日中に対応すべき案件は？',
        ],
      },
      {
        id: 'clerk-invoice-status',
        name: '請求・入金状況',
        role: 'office_manager',
        domain: 'ledger',
        prompt: '未収金の状況や支払い遅延のある顧客を確認し、フォローアップが必要な案件を教えてください。',
        parameters: { includeAging: true, showRisks: true },
        maskLevel: 'strict',
        examples: [
          '支払いが遅れている顧客は？',
          '今月の回収予定は？',
          '督促が必要な案件は？',
        ],
      },
      {
        id: 'clerk-schedule-coordination',
        name: 'スケジュール調整',
        role: 'office_manager',
        domain: 'general',
        prompt: '来週のスケジュールを確認し、リソースの競合や調整が必要な箇所を特定してください。',
        parameters: { lookAhead: 7, includeResources: true },
        maskLevel: 'none',
        examples: [
          '来週の予定で調整が必要なのは？',
          '車両や会議室の空き状況は？',
          'ダブルブッキングはない？',
        ],
      },

      // アフターケア用プリセット
      {
        id: 'aftercare-inspection-priority',
        name: '点検優先順位',
        role: 'aftercare',
        domain: 'aftercare',
        prompt: '今週の点検予定を確認し、優先度の高い案件や注意が必要な顧客を教えてください。',
        parameters: { includePriority: true, showHistory: true },
        maskLevel: 'none',
        examples: [
          '優先的に点検すべき物件は？',
          '過去に問題があった顧客は？',
          '今週の点検で注意すべき点は？',
        ],
      },
      {
        id: 'aftercare-defect-analysis',
        name: '不具合分析',
        role: 'aftercare',
        domain: 'aftercare',
        prompt: '最近の不具合報告を分析し、傾向や予防策、対応が必要な案件を教えてください。',
        parameters: { includeTrends: true, analysisPeriod: 30 },
        maskLevel: 'basic',
        examples: [
          '多発している不具合の種類は？',
          '予防策が効果的だった事例は？',
          '至急対応が必要な不具合は？',
        ],
      },
      {
        id: 'aftercare-satisfaction-review',
        name: '満足度レビュー',
        role: 'aftercare',
        domain: 'aftercare',
        prompt: '顧客満足度の状況を確認し、改善が必要な領域やフォローアップすべき顧客を教えてください。',
        parameters: { includeNPS: true, showTrends: true },
        maskLevel: 'basic',
        examples: [
          '満足度が下がっている顧客は？',
          'サービス改善のポイントは？',
          'フォローが必要な顧客は？',
        ],
      },

      // 全役職共通プリセット
      {
        id: 'general-company-overview',
        name: '会社概況',
        role: 'all',
        domain: 'general',
        prompt: '会社全体の業績や重要な指標の状況を確認し、注意すべき点や改善機会を教えてください。',
        parameters: { includeKPIs: true, showTrends: true },
        maskLevel: 'strict',
        examples: [
          '今月の業績はどうですか？',
          '改善が必要な領域は？',
          '好調な部門は？',
        ],
      },
    ];
  }

  private async getPreset(presetId: string): Promise<RAGPreset | null> {
    const presets = this.getAllPresets();
    return presets.find(p => p.id === presetId) || null;
  }

  private buildQueryFromPreset(preset: RAGPreset, query: RAGQueryWithPreset): string {
    let fullQuery = preset.prompt;

    // 追加のユーザー入力があれば結合
    if (query.userInput) {
      fullQuery += `\n\n追加の質問: ${query.userInput}`;
    }

    // パラメータに基づく調整
    if (preset.parameters.includeRisks) {
      fullQuery += '\nリスクや注意点も含めて回答してください。';
    }

    if (preset.parameters.showDeadlines) {
      fullQuery += '\n期限や締切情報も重要です。';
    }

    if (preset.parameters.includeSLA) {
      fullQuery += '\nSLA（サービスレベル合意）の観点も考慮してください。';
    }

    return fullQuery;
  }

  private convertSourcesToCitations(sources: any[], domain: string): Array<{
    id: string;
    type: 'document' | 'data' | 'record';
    title: string;
    excerpt: string;
    pageNumber?: number;
    recordId?: string;
    relevanceScore: number;
    url?: string;
  }> {
    return sources.map((source, index) => ({
      id: `citation_${index + 1}`,
      type: this.getSourceType(source.type),
      title: source.title,
      excerpt: source.excerpt,
      pageNumber: this.generatePageNumber(source.type, index),
      recordId: source.id,
      relevanceScore: source.relevanceScore,
      url: this.generateSourceUrl(domain, source.type, source.id),
    }));
  }

  private getSourceType(sourceType: string): 'document' | 'data' | 'record' {
    const typeMapping = {
      'project': 'record',
      'contract': 'record',
      'invoice': 'record',
      'inspection': 'record',
      'defect': 'record',
      'maintenance': 'record',
      'satisfaction': 'data',
    };

    return typeMapping[sourceType] || 'data';
  }

  private generatePageNumber(sourceType: string, index: number): number {
    // ソースタイプに基づいてページ番号を生成（実際はドキュメントから取得）
    const pageMapping = {
      'project': 10 + index,
      'contract': 20 + index,
      'invoice': 30 + index,
      'inspection': 40 + index,
      'defect': 50 + index,
    };

    return pageMapping[sourceType] || (index + 1);
  }

  private generateSourceUrl(domain: string, sourceType: string, sourceId: string): string {
    const baseUrls = {
      ledger: {
        project: `/projects/${sourceId}`,
        contract: `/contracts/${sourceId}`,
        invoice: `/invoices/${sourceId}`,
        payment: `/payments/${sourceId}`,
      },
      aftercare: {
        inspection: `/aftercare/inspections/${sourceId}`,
        defect: `/aftercare/defects/${sourceId}`,
        maintenance: `/aftercare/maintenance/${sourceId}`,
        satisfaction: `/aftercare/surveys/${sourceId}`,
      },
    };

    return baseUrls[domain]?.[sourceType] || '#';
  }

  private applyMasking(answer: string, maskLevel: 'none' | 'basic' | 'strict', userRole: string): string {
    if (maskLevel === 'none') {
      return answer;
    }

    // 新人や一般事務向けのマスキングルール
    const isRestrictedRole = ['clerk', 'receptionist', 'junior'].includes(userRole);

    if (maskLevel === 'basic' || (maskLevel === 'strict' && isRestrictedRole)) {
      // 金額情報のマスキング
      answer = answer.replace(/¥[\d,]+/g, '¥***');
      answer = answer.replace(/\d+円/g, '***円');

      // 具体的な数値のマスキング
      if (maskLevel === 'strict') {
        answer = answer.replace(/\d+%/g, '**%');
        answer = answer.replace(/\d+件/g, '**件');
        answer = answer.replace(/\d+日/g, '**日');
      }
    }

    return answer;
  }
}