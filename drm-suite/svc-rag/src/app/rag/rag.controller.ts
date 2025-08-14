import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { LedgerRAGService, LedgerRAGQuery, LedgerRAGResponse } from './ledger-rag.service';
import { AftercareRAGService, AftercareRAGQuery, AftercareRAGResponse } from './aftercare-rag.service';
import { PresetRAGService, RAGQueryWithPreset, RAGResponseWithCitations } from './preset-rag.service';

@Controller('rag')
export class RAGController {
  constructor(
    private readonly ledgerRAGService: LedgerRAGService,
    private readonly aftercareRAGService: AftercareRAGService,
    private readonly presetRAGService: PresetRAGService,
  ) {}

  /**
   * 工事台帳関連の質問応答
   */
  @Post('ledger/query')
  async queryLedger(
    @Body() query: {
      question: string;
      companyId: string;
      storeId?: string;
      projectId?: string;
      contractId?: string;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
    @Headers('x-plan-level') planLevel?: string,
  ): Promise<LedgerRAGResponse> {
    this.validateAccess(userRole, ['construction_manager', 'project_manager', 'accounting', 'office_manager', 'admin']);

    if (!query.question || query.question.trim().length === 0) {
      throw new BadRequestException('質問内容を入力してください。');
    }

    if (query.question.length > 1000) {
      throw new BadRequestException('質問内容は1000文字以内で入力してください。');
    }

    const ragQuery: LedgerRAGQuery = {
      ...query,
      context: {
        role: userRole!,
        userId: userId!,
        planLevel: (planLevel as 'LITE' | 'STANDARD' | 'PRO') || 'LITE',
      },
    };

    return this.ledgerRAGService.queryLedger(ragQuery);
  }

  /**
   * アフターケア関連の質問応答
   */
  @Post('aftercare/query')
  async queryAftercare(
    @Body() query: {
      question: string;
      companyId: string;
      storeId?: string;
      customerId?: string;
      projectId?: string;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ): Promise<AftercareRAGResponse> {
    this.validateAccess(userRole, ['aftercare', 'customer_service', 'maintenance', 'construction_manager', 'admin']);

    if (!query.question || query.question.trim().length === 0) {
      throw new BadRequestException('質問内容を入力してください。');
    }

    if (query.question.length > 1000) {
      throw new BadRequestException('質問内容は1000文字以内で入力してください。');
    }

    const ragQuery: AftercareRAGQuery = {
      ...query,
      context: {
        role: userRole!,
        userId: userId!,
      },
    };

    return this.aftercareRAGService.queryAftercare(ragQuery);
  }

  /**
   * 統合検索（工事台帳＋アフターケア）
   */
  @Post('integrated/query')
  async queryIntegrated(
    @Body() query: {
      question: string;
      companyId: string;
      storeId?: string;
      scope?: 'ledger' | 'aftercare' | 'both';
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
    @Headers('x-plan-level') planLevel?: string,
  ) {
    this.validateAccess(userRole, ['admin', 'general_manager', 'owner']);

    if (!query.question || query.question.trim().length === 0) {
      throw new BadRequestException('質問内容を入力してください。');
    }

    const scope = query.scope || 'both';
    const results: any = {};

    try {
      if (scope === 'ledger' || scope === 'both') {
        const ledgerQuery: LedgerRAGQuery = {
          question: query.question,
          companyId: query.companyId,
          storeId: query.storeId,
          context: {
            role: userRole!,
            userId: userId!,
            planLevel: (planLevel as 'LITE' | 'STANDARD' | 'PRO') || 'LITE',
          },
        };
        results.ledger = await this.ledgerRAGService.queryLedger(ledgerQuery);
      }

      if (scope === 'aftercare' || scope === 'both') {
        const aftercareQuery: AftercareRAGQuery = {
          question: query.question,
          companyId: query.companyId,
          storeId: query.storeId,
          context: {
            role: userRole!,
            userId: userId!,
          },
        };
        results.aftercare = await this.aftercareRAGService.queryAftercare(aftercareQuery);
      }

      // 統合回答の生成
      if (scope === 'both') {
        results.integrated = this.generateIntegratedResponse(results.ledger, results.aftercare, query.question);
      }

      return results;
    } catch (error) {
      throw new BadRequestException('検索処理中にエラーが発生しました。');
    }
  }

  /**
   * よくある質問一覧
   */
  @Post('suggestions/:domain')
  async getSuggestions(
    @Body() context: {
      companyId: string;
      storeId?: string;
      role?: string;
    },
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateAccess(userRole, ['construction_manager', 'accounting', 'aftercare', 'admin']);

    const suggestions = {
      ledger: [
        'プロジェクトの進捗状況は？',
        '今月の予算と実績の差異は？',
        '未回収の売掛金はいくら？',
        '利益率が最も高いプロジェクトは？',
        '契約変更が多いプロジェクトは？',
        '来月の資金繰り予測は？',
        '原価率が予算を超過しているプロジェクトは？',
        '完成間近のプロジェクトは？',
      ],
      aftercare: [
        '今週予定されている点検は？',
        '未解決の不具合はいくつある？',
        '保証期限が近い顧客は？',
        '顧客満足度の平均は？',
        'メンテナンス契約の更新が必要な顧客は？',
        '最近のクレーム傾向は？',
        '点検で発見される問題の種類は？',
        'NPS（推奨度）の改善状況は？',
      ],
      general: [
        '全体的な業績はどう？',
        '注意すべきプロジェクトは？',
        '顧客満足度が下がっている理由は？',
        '収益性を改善するには？',
        'リスクの高い案件は？',
        '来期の見通しは？',
      ],
    };

    return suggestions;
  }

  /**
   * 検索履歴の取得
   */
  @Post('history')
  async getSearchHistory(
    @Body() query: {
      companyId: string;
      userId?: string;
      limit?: number;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    // 実際の実装では検索履歴をデータベースに保存し、取得する
    return {
      history: [
        {
          id: '1',
          question: 'プロジェクトの進捗状況は？',
          timestamp: new Date(),
          domain: 'ledger',
        },
        {
          id: '2',
          question: '今週の点検予定は？',
          timestamp: new Date(),
          domain: 'aftercare',
        },
      ],
    };
  }

  // ==================== プライベートメソッド ====================

  private validateAccess(userRole: string | undefined, allowedRoles: string[]) {
    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new UnauthorizedException('このRAG機能にアクセスする権限がありません。');
    }
  }

  private generateIntegratedResponse(
    ledgerResponse: LedgerRAGResponse,
    aftercareResponse: AftercareRAGResponse,
    question: string
  ) {
    // 統合回答の生成ロジック
    const combinedSources = [
      ...ledgerResponse.sources.map(s => ({ ...s, domain: 'ledger' })),
      ...aftercareResponse.sources.map(s => ({ ...s, domain: 'aftercare' })),
    ];

    // 関連性スコアでソート
    combinedSources.sort((a, b) => b.relevanceScore - a.relevanceScore);

    const integratedAnswer = this.synthesizeAnswers(ledgerResponse.answer, aftercareResponse.answer);
    const combinedConfidence = (ledgerResponse.confidence + aftercareResponse.confidence) / 2;

    return {
      answer: integratedAnswer,
      confidence: combinedConfidence,
      sources: combinedSources.slice(0, 10), // 上位10件
      suggestions: [
        ...ledgerResponse.suggestions.slice(0, 2),
        ...aftercareResponse.suggestions.slice(0, 2),
      ],
      relatedQueries: [
        ...ledgerResponse.relatedQueries.slice(0, 2),
        ...aftercareResponse.relatedQueries.slice(0, 2),
      ],
      urgentActions: aftercareResponse.urgentActions || [],
    };
  }

  private synthesizeAnswers(ledgerAnswer: string, aftercareAnswer: string): string {
    return `## 統合回答\n\n` +
           `### 📊 工事台帳関連\n${ledgerAnswer}\n\n` +
           `### 🔧 アフターケア関連\n${aftercareAnswer}\n\n` +
           `💡 **総合的な推奨事項**\n` +
           `両方の観点から業務を改善することで、より効果的な管理が可能になります。` +
           `定期的なデータ分析と顧客フォローアップを継続してください。`;
  }

  /**
   * プリセットクエリ実行（citations必須）
   */
  @Post('preset/query')
  async queryWithPreset(
    @Body() query: {
      presetId: string;
      companyId: string;
      projectId?: string;
      customerId?: string;
      userInput?: string;
      additionalContext?: Record<string, any>;
    },
    @Headers('x-user-id') userId?: string,
    @Headers('x-user-role') userRole?: string,
  ): Promise<RAGResponseWithCitations> {
    if (!userId || !userRole) {
      throw new UnauthorizedException('ユーザー情報が必要です');
    }

    if (!query.presetId || query.presetId.trim().length === 0) {
      throw new BadRequestException('プリセットIDが必要です');
    }

    const ragQuery: RAGQueryWithPreset = {
      presetId: query.presetId,
      companyId: query.companyId,
      projectId: query.projectId,
      customerId: query.customerId,
      userInput: query.userInput,
      additionalContext: query.additionalContext,
    };

    const response = await this.presetRAGService.queryWithPreset(ragQuery, userId, userRole);

    // 使用履歴を保存
    await this.presetRAGService.savePresetUsage(
      userId,
      query.companyId,
      query.presetId,
      query.userInput || 'プリセットクエリ',
      response
    );

    return response;
  }

  /**
   * 役職別プリセット一覧取得
   */
  @Get('presets/:role')
  async getPresetsForRole(
    @Param('role') role: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    // 自分の役職または管理者のみアクセス可能
    if (userRole !== role && userRole !== 'admin') {
      throw new UnauthorizedException('このプリセット一覧にアクセスする権限がありません');
    }

    const presets = await this.presetRAGService.getPresetsForRole(role);
    return { presets };
  }

  /**
   * プリセット使用統計
   */
  @Get('presets/stats/:companyId')
  async getPresetUsageStats(
    @Param('companyId') companyId: string,
    @Query('userId') userId?: string,
    @Query('period') period?: string,
    @Headers('x-user-role') userRole?: string,
  ) {
    this.validateAccess(userRole, ['admin', 'general_manager']);

    // 実際の実装では統計データを取得
    return {
      stats: {
        totalQueries: 150,
        mostUsedPreset: 'foreman-progress-check',
        averageConfidence: 0.87,
        citationUsage: 0.95,
        userBreakdown: {
          foreman: 45,
          clerk: 35,
          aftercare: 25,
        },
      },
    };
  }
}