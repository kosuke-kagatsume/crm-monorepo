'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useFeatureFlag } from '@/config/featureFlags';
import { maskRAGResponse } from '../../../libs/rag/mask';
import type { Role } from '@/config/permissions';
import {
  Search,
  Sparkles,
  FileText,
  X,
  AlertTriangle,
  BookOpen,
  Shield,
} from 'lucide-react';

import { RagPreset } from '@/config/roleWidgets';

interface RAGPanelProps {
  ragPresets: RagPreset[];
  isVisible: boolean;
  onClose: () => void;
  userRole?: Role; // 役職情報
}

interface RAGCitation {
  id: string;
  title: string;
  excerpt: string;
  pageNumber: number; // 必須に変更
  relevanceScore: number;
  documentUrl?: string;
  sectionTitle?: string;
}

interface RAGResult {
  id: string;
  content: string;
  citations: RAGCitation[]; // 最低1つの引用が必須
  timestamp: string;
  hasValidCitations: boolean; // 引用検証フラグ
  isTemplate?: boolean; // テンプレート結果かどうか
  isError?: boolean; // エラー結果かどうか
  templates?: string[]; // テンプレート一覧
  citationWarning?: string; // 引用警告メッセージ
  redactionsApplied?: boolean; // マスク適用フラグ
  redactedPatterns?: string[]; // マスクされたパターン
}

export function RAGPanel({
  ragPresets,
  isVisible,
  onClose,
  userRole = 'sales',
}: RAGPanelProps) {
  const searchParams = useSearchParams();
  const citationsRequired = useFeatureFlag('rag_citations', searchParams);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RAGResult[]>([]);
  const [loading, setLoading] = useState(false);

  const generateMockCitations = (searchQuery: string): RAGCitation[] => {
    const templates = [
      { title: '施工管理マニュアル', base: 42, score: 0.95 },
      { title: '安全管理規程', base: 15, score: 0.87 },
      { title: '見積作成ガイドライン', base: 28, score: 0.82 },
      { title: '品質管理手順書', base: 67, score: 0.78 },
      { title: '顧客対応マニュアル', base: 93, score: 0.75 },
    ];

    const selectedTemplates = templates
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 2)); // 2-3個の引用

    return selectedTemplates.map((template, index) => ({
      id: `c${Date.now()}-${index}`,
      title: template.title,
      excerpt: `${searchQuery}に関連する記述: この項目では具体的な手順と注意点について詳しく説明されています...`,
      pageNumber: template.base + Math.floor(Math.random() * 10), // ランダムなページ番号
      relevanceScore: template.score + (Math.random() - 0.5) * 0.1,
      sectionTitle: `第${Math.floor(Math.random() * 5) + 1}章`,
      documentUrl: `/documents/${template.title.replace(/\s+/g, '_')}.pdf`,
    }));
  };

  const showTemplateResults = (searchQuery: string): RAGResult => {
    return {
      id: `template-${Date.now()}`,
      content: `「${searchQuery}」に関する情報が見つかりませんでした。\n\n以下の見積テンプレートをご参考ください：`,
      citations: [
        {
          id: 'template-1',
          title: '外壁塗装標準見積テンプレート',
          excerpt: '一般的な外壁塗装工事の見積項目と標準単価...',
          pageNumber: 1,
          relevanceScore: 0.7,
          sectionTitle: 'テンプレート集',
          documentUrl: '/templates/exterior_painting.pdf',
        },
        {
          id: 'template-2',
          title: 'リフォーム工事見積テンプレート',
          excerpt: 'キッチン・浴室等のリフォーム標準見積...',
          pageNumber: 1,
          relevanceScore: 0.65,
          sectionTitle: 'テンプレート集',
          documentUrl: '/templates/renovation.pdf',
        },
      ],
      timestamp: new Date().toISOString(),
      hasValidCitations: true,
    };
  };

  const executeRAG = async (searchQuery: string) => {
    setLoading(true);
    try {
      // プロジェクト文脈の取得
      const currentProjectId = localStorage.getItem('currentProjectId') || null;
      const selectedCustomer = localStorage.getItem('selectedCustomer') || null;

      // 実際のRAG APIを呼び出し（役職とプロジェクト文脈を含む）
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          role: userRole,
          context: {
            projectId: currentProjectId,
            customer: selectedCustomer,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API エラー: ${response.status}`);
      }

      const apiResult = await response.json();

      let newResult: RAGResult;

      // APIからテンプレートが返された場合（引用なし）
      if (apiResult.templates && apiResult.templates.length > 0) {
        newResult = {
          id: `template-${Date.now()}`,
          content: apiResult.answer,
          citations: [],
          timestamp: new Date().toISOString(),
          hasValidCitations: false,
          isTemplate: true,
          templates: apiResult.templates,
        };
      } else {
        // 通常の検索結果
        newResult = {
          id: Date.now().toString(),
          content: apiResult.answer,
          citations: apiResult.citations || [],
          timestamp: new Date().toISOString(),
          hasValidCitations: (apiResult.citations || []).length > 0,
          redactionsApplied: apiResult.redactionsApplied,
          redactedPatterns: apiResult.redactedPatterns,
        };
      }

      // 引用必須フラグが有効で、引用が無い場合は警告を追加
      if (citationsRequired && !newResult.hasValidCitations) {
        newResult.citationWarning =
          '⚠️ この回答には検証可能な引用元がありません';
      }

      setResults([newResult, ...results.slice(0, 4)]); // 最大5件保持
      setQuery('');
    } catch (error) {
      console.error('RAG検索エラー:', error);

      // エラー結果を追加
      const errorResult: RAGResult = {
        id: `error-${Date.now()}`,
        content:
          'エラーが発生しました。しばらく時間をおいてからお試しください。',
        citations: [],
        timestamp: new Date().toISOString(),
        hasValidCitations: false,
        isError: true,
      };

      setResults([errorResult, ...results.slice(0, 4)]);
    } finally {
      setLoading(false);
    }
  };

  const executePreset = (preset: RagPreset) => {
    executeRAG(preset.prompt);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 w-96 h-full bg-white border-l shadow-lg z-50 flex flex-col">
      {/* ヘッダー */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h3 className="font-semibold">RAGアシスタント</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* プリセットボタン */}
      <div className="p-4 border-b">
        <div className="text-xs font-medium text-gray-600 mb-3">
          よく使う質問
        </div>
        <div className="grid grid-cols-1 gap-2">
          {ragPresets.map((preset, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => executePreset(preset)}
              disabled={loading}
              className="text-xs h-auto p-3 text-left justify-start whitespace-normal"
              title={preset.prompt} // ツールチップで詳細表示
            >
              <div className="flex items-start gap-2 w-full">
                <span className="text-blue-600 font-medium flex-shrink-0">
                  {preset.title}
                </span>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* 検索入力 */}
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="質問を入力..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                executeRAG(query);
              }
            }}
            disabled={loading}
            className="text-sm"
          />
          <Button
            size="sm"
            onClick={() => query.trim() && executeRAG(query)}
            disabled={loading || !query.trim()}
            className="px-3"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 結果表示 */}
      <ScrollArea className="flex-1 p-4">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {results.map((result) => (
          <Card
            key={result.id}
            className={`mb-4 ${
              result.isError
                ? 'border-red-200 bg-red-50'
                : result.isTemplate
                  ? 'border-blue-200 bg-blue-50'
                  : !result.hasValidCitations
                    ? 'border-orange-200 bg-orange-50'
                    : ''
            }`}
          >
            <CardContent className="p-4">
              {/* エラー警告 */}
              {result.isError && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-red-100 rounded border border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-xs text-red-800 font-medium">
                    システムエラー
                  </span>
                </div>
              )}

              {/* テンプレート通知 */}
              {result.isTemplate && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-blue-100 rounded border border-blue-200">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-xs text-blue-800 font-medium">
                    検索結果なし：テンプレート表示
                  </span>
                </div>
              )}

              {/* 引用必須警告 */}
              {result.citationWarning && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-orange-100 rounded border border-orange-200">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-xs text-orange-800 font-medium">
                    {result.citationWarning}
                  </span>
                </div>
              )}

              {/* マスク適用通知 */}
              {result.redactionsApplied && (
                <div className="flex items-center gap-2 mb-3 p-2 bg-purple-100 rounded border border-purple-200">
                  <Shield className="h-4 w-4 text-purple-600" />
                  <span className="text-xs text-purple-800 font-medium">
                    権限により一部情報がマスクされています
                  </span>
                </div>
              )}

              <p className="text-sm whitespace-pre-wrap mb-4">
                {result.content}
              </p>

              {/* テンプレート一覧表示 */}
              {result.templates && result.templates.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-xs font-medium text-blue-800 mb-2">
                    よく使われるテンプレート
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {result.templates.map((template, index) => (
                      <button
                        key={index}
                        onClick={() => executeRAG(template)}
                        className="text-xs text-left p-2 bg-white rounded border hover:bg-blue-100 transition-colors"
                      >
                        📄 {template}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 引用元表示（必須） */}
              {result.citations.length > 0 ? (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                    <p className="text-xs font-medium text-blue-800">
                      引用元 ({result.citations.length}件)
                    </p>
                    {citationsRequired && (
                      <Badge variant="outline" className="text-xs bg-blue-50">
                        必須検証済み
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-3">
                    {result.citations.map((citation) => (
                      <div
                        key={citation.id}
                        className="text-xs border rounded p-2 bg-gray-50"
                      >
                        <div className="flex items-start gap-2">
                          <FileText className="h-3 w-3 mt-0.5 text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {citation.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className="text-xs bg-white"
                              >
                                P.{citation.pageNumber}
                              </Badge>
                              {citation.sectionTitle && (
                                <Badge variant="outline" className="text-xs">
                                  {citation.sectionTitle}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                関連度{' '}
                                {Math.round(citation.relevanceScore * 100)}%
                              </Badge>
                            </div>
                            <p className="text-gray-600 mt-2 leading-relaxed">
                              {citation.excerpt}
                            </p>
                            {citation.documentUrl && (
                              <div className="mt-2">
                                <button className="text-blue-600 hover:text-blue-800 text-xs underline">
                                  📄 ドキュメントを開く
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                citationsRequired && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded border border-red-200">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div className="text-xs text-red-800">
                        <p className="font-medium">引用元が見つかりません</p>
                        <p className="mt-1">
                          この情報は信頼性が確認できないため、ご利用の際はご注意ください。
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}

              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                <p className="text-xs text-gray-400">
                  {new Date(result.timestamp).toLocaleTimeString('ja-JP')}
                </p>
                {citationsRequired && (
                  <Badge
                    variant={
                      result.hasValidCitations ? 'default' : 'destructive'
                    }
                    className="text-xs"
                  >
                    {result.hasValidCitations ? '✓ 検証済み' : '⚠ 要確認'}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {results.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">プリセットボタンをクリックするか、</p>
            <p className="text-sm">質問を入力してください</p>
            {citationsRequired && (
              <div className="mt-4 p-3 bg-blue-50 rounded border">
                <div className="flex items-center justify-center gap-2 text-xs text-blue-800">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-medium">引用必須モード有効</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  検索結果には必ず引用元とページ番号が表示されます
                </p>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
