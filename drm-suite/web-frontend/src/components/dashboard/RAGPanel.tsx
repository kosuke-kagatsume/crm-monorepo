'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Sparkles, FileText, X } from 'lucide-react';

interface RAGPanelProps {
  ragPresets: string[];
  isVisible: boolean;
  onClose: () => void;
}

interface RAGResult {
  id: string;
  content: string;
  citations: Array<{
    id: string;
    title: string;
    excerpt: string;
    pageNumber?: number;
    relevanceScore: number;
  }>;
  timestamp: string;
}

export function RAGPanel({ ragPresets, isVisible, onClose }: RAGPanelProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<RAGResult[]>([]);
  const [loading, setLoading] = useState(false);

  const executeRAG = async (searchQuery: string) => {
    setLoading(true);
    try {
      // モック実装：1秒待機してダミー結果を返す
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const newResult: RAGResult = {
        id: Date.now().toString(),
        content: `「${searchQuery}」に関する検索結果:\n\n関連する情報が見つかりました。詳細は引用元をご確認ください。`,
        citations: [
          {
            id: 'c1',
            title: '施工管理マニュアル',
            excerpt: '出来高管理の基本的な流れについて...',
            pageNumber: 42,
            relevanceScore: 0.95,
          },
          {
            id: 'c2',
            title: '安全管理規程',
            excerpt: '現場での安全確認項目について...',
            pageNumber: 15,
            relevanceScore: 0.87,
          },
        ],
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

  const executePreset = (preset: string) => {
    executeRAG(preset);
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
        <div className="grid grid-cols-2 gap-2">
          {ragPresets.map((preset) => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              onClick={() => executePreset(preset)}
              disabled={loading}
              className="text-xs"
            >
              {preset}
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
          <Card key={result.id} className="mb-4">
            <CardContent className="p-4">
              <p className="text-sm whitespace-pre-wrap mb-4">{result.content}</p>

              {/* 引用元表示 */}
              {result.citations.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">
                    引用元:
                  </p>
                  <div className="space-y-2">
                    {result.citations.map((citation) => (
                      <div key={citation.id} className="text-xs">
                        <div className="flex items-start gap-2">
                          <FileText className="h-3 w-3 mt-0.5 text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium">{citation.title}</div>
                            {citation.pageNumber && (
                              <Badge variant="outline" className="text-xs mt-1">
                                P.{citation.pageNumber}
                              </Badge>
                            )}
                            <p className="text-gray-500 mt-1">
                              {citation.excerpt}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(citation.relevanceScore * 100)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-400 mt-3">
                {new Date(result.timestamp).toLocaleTimeString('ja-JP')}
              </p>
            </CardContent>
          </Card>
        ))}

        {results.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-500">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">プリセットボタンをクリックするか、</p>
            <p className="text-sm">質問を入力してください</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}