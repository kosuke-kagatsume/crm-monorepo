import {
  Controller,
  Post,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RagService } from './rag.service';
import { MaskPolicyService } from '@drm-suite/rag';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface RagQueryRequest {
  query: string;
  tenantId: string;
  filters?: Record<string, any>;
  userRoles?: string[];
}

interface Citation {
  docId: string;
  page: number;
  relevance: number;
  snippet?: string;
}

interface RagQueryResponse {
  answer: string;
  citations: Citation[];
  redactionsApplied: boolean;
  fallbackUsed?: boolean;
  suggestions?: string[];
}

@Controller('rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
    private readonly maskPolicyService: MaskPolicyService,
  ) {}

  @Post('query')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async query(
    @Body() request: RagQueryRequest,
    @Req() req: any,
  ): Promise<RagQueryResponse> {
    const userRoles = request.userRoles || req.user?.roles || ['user'];
    
    // Execute RAG query
    const result = await this.ragService.query(
      request.query,
      request.tenantId,
      request.filters,
    );

    // Check if fallback is needed (no results)
    if (!result.documents || result.documents.length === 0) {
      return this.generateFallbackResponse(request.query);
    }

    // Apply mask policy to the response
    const maskResult = this.maskPolicyService.applyMask(
      {
        answer: result.answer,
        documents: result.documents,
      },
      userRoles,
    );

    // Mask the answer text as well
    const maskedAnswer = this.maskPolicyService.maskTextContent(
      maskResult.data.answer,
      userRoles,
    );

    // Extract citations from documents
    const citations = this.extractCitations(result.documents);

    return {
      answer: maskedAnswer,
      citations,
      redactionsApplied: maskResult.redactionsApplied,
      fallbackUsed: false,
    };
  }

  @Post('search')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async search(
    @Body() request: { query: string; tenantId: string; limit?: number },
  ): Promise<any> {
    const results = await this.ragService.search(
      request.query,
      request.tenantId,
      request.limit || 10,
    );

    if (results.length === 0) {
      return {
        documents: [],
        message: '該当する情報が見つかりませんでした',
        suggestions: this.getSearchSuggestions(),
      };
    }

    return { documents: results };
  }

  /**
   * Extract citations from RAG documents
   */
  private extractCitations(documents: any[]): Citation[] {
    if (!documents || documents.length === 0) {
      return [];
    }

    return documents.map((doc, index) => ({
      docId: doc.id || `doc_${index}`,
      page: doc.page || this.extractPageNumber(doc.content) || 1,
      relevance: doc.relevance || doc.score || 0.5,
      snippet: this.extractSnippet(doc.content),
    }));
  }

  /**
   * Extract page number from document content
   */
  private extractPageNumber(content: string): number {
    const pageMatch = content.match(/page[:\s]+(\d+)/i);
    if (pageMatch) {
      return parseInt(pageMatch[1], 10);
    }
    return 1;
  }

  /**
   * Extract snippet from document content
   */
  private extractSnippet(content: string, maxLength: number = 200): string {
    if (!content) return '';
    
    const cleaned = content.replace(/\s+/g, ' ').trim();
    if (cleaned.length <= maxLength) {
      return cleaned;
    }
    
    return cleaned.substring(0, maxLength) + '...';
  }

  /**
   * Generate fallback response when no results found
   */
  private generateFallbackResponse(query: string): RagQueryResponse {
    const suggestions = this.getQuerySuggestions(query);
    
    return {
      answer: this.getFallbackMessage(query),
      citations: [],
      redactionsApplied: false,
      fallbackUsed: true,
      suggestions,
    };
  }

  /**
   * Get fallback message based on query type
   */
  private getFallbackMessage(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('見積') || lowerQuery.includes('費用')) {
      return '申し訳ございません。お探しの見積情報が見つかりませんでした。見積作成をご希望の場合は、営業担当者にお問い合わせください。';
    }
    
    if (lowerQuery.includes('工事') || lowerQuery.includes('施工')) {
      return '申し訳ございません。該当する工事情報が見つかりませんでした。工事管理システムで最新の情報をご確認ください。';
    }
    
    if (lowerQuery.includes('在庫') || lowerQuery.includes('資材')) {
      return '申し訳ございません。在庫情報が見つかりませんでした。在庫管理システムで最新の在庫状況をご確認ください。';
    }
    
    return '申し訳ございません。お探しの情報が見つかりませんでした。別のキーワードでお試しいただくか、サポートにお問い合わせください。';
  }

  /**
   * Get query suggestions based on context
   */
  private getQuerySuggestions(query: string): string[] {
    const suggestions = [
      '見積書の作成方法を教えてください',
      '工事の進捗状況を確認したい',
      '在庫の確認方法について',
      '顧客情報の登録手順',
      'アフターケアの予定を確認',
    ];

    // Add context-specific suggestions
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('見積')) {
      suggestions.unshift('過去の見積一覧を表示');
      suggestions.unshift('見積テンプレートを使用');
    }
    
    if (lowerQuery.includes('工事')) {
      suggestions.unshift('本日の工事予定');
      suggestions.unshift('工事台帳の確認');
    }

    return suggestions.slice(0, 5);
  }

  /**
   * Get general search suggestions
   */
  private getSearchSuggestions(): string[] {
    return [
      '見積書テンプレート',
      '工事管理マニュアル',
      '在庫管理ガイド',
      '顧客対応手順書',
      'システム操作マニュアル',
    ];
  }
}