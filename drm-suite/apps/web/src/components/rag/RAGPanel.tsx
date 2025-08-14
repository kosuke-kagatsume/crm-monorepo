'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Database, Link2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface RAGPanelProps {
  role: 'foreman' | 'clerk' | 'aftercare';
  presets: string[];
}

interface RAGResult {
  id: string;
  content: string;
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
  timestamp: string;
}

export function RAGPanel({ role, presets }: RAGPanelProps) {
  const { companyId } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RAGResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // プリセットボタンの表示名マッピング
  const presetLabels: Record<string, string> = {
    'foreman-progress-check': '進捗確認',
    'foreman-budget-status': '予算状況',
    'foreman-safety-check': '安全確認',
    'clerk-customer-search': '顧客検索',
    'clerk-document-template': '書類テンプレ',
    'clerk-payment-status': '入金状況',
    'aftercare-maintenance-history': 'メンテ履歴',
    'aftercare-warranty-check': '保証確認',
    'aftercare-repair-guide': '修理ガイド',
  };

  // RAG検索実行
  const executeRAG = async (input: string, presetId?: string) => {
    setLoading(true);
    try {
      const response = await api.post(`/rag/${companyId}/search`, {
        query: input,
        role: role,
        presetId: presetId,
      });

      const newResult: RAGResult = {
        id: Date.now().toString(),
        content: response.data.content,
        citations: response.data.citations || [],
        timestamp: new Date().toISOString(),
      };

      setResults([newResult, ...results.slice(0, 4)]); // 最大5件保持
      setQuery('');
    } catch (error) {
      console.error('RAG search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // プリセット実行
  const executePreset = async (presetId: string) => {
    setActivePreset(presetId);
    await executeRAG('', presetId);
    setActivePreset(null);
  };

  // 引用元アイコン取得
  const getCitationIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-3 w-3" />;
      case 'data': return <Database className="h-3 w-3" />;
      case 'record': return <Link2 className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold flex items-center">
          <Sparkles className="mr-2 h-4 w-4" />
          RAGアシスタント
        </h3>
      </div>

      {/* プリセットボタン */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset}
              className="text-sm px-3 py-1"
              onClick={() => executePreset(preset)}
              disabled={loading || activePreset === preset}
            >
              {presetLabels[preset] || preset}
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
          />
          <Button
            className="px-3"
            onClick={() => query.trim() && executeRAG(query)}
            disabled={loading || !query.trim()}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 結果表示 */}
      <ScrollArea className="flex-1 p-4">
        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {results.map((result) => (
          <Card key={result.id} className="mb-4">
            <CardContent className="pt-4">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{result.content}</p>
              </div>

              {/* 引用元表示 */}
              {result.citations.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-medium text-gray-500 mb-2">引用元:</p>
                  <div className="space-y-2">
                    {result.citations.map((citation) => (
                      <div key={citation.id} className="text-xs">
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">{getCitationIcon(citation.type)}</div>
                          <div className="flex-1">
                            <div className="font-medium">{citation.title}</div>
                            {citation.pageNumber && (
                              <Badge className="text-xs mt-1">
                                P.{citation.pageNumber}
                              </Badge>
                            )}
                            <p className="text-gray-500 mt-1 line-clamp-2">
                              {citation.excerpt}
                            </p>
                            {citation.url && (
                              <a
                                href={citation.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                詳細を見る
                              </a>
                            )}
                          </div>
                          <Badge className="text-xs">
                            {Math.round(citation.relevanceScore * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-2">
                {new Date(result.timestamp).toLocaleTimeString('ja-JP')}
              </p>
            </CardContent>
          </Card>
        ))}

        {results.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>プリセットボタンをクリックするか、</p>
            <p>質問を入力してください</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}