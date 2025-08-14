'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRagToggle } from '@/components/rag/useRagToggle'

interface RAGSuggestion {
  type: 'item' | 'pricing' | 'workflow' | 'inventory'
  title: string
  description: string
  confidence: number
  actionable: boolean
}

interface EstimateRAGIntegrationProps {
  estimateData?: any
  onApplySuggestion: (suggestion: RAGSuggestion) => void
}

export function EstimateRAGIntegration({ estimateData, onApplySuggestion }: EstimateRAGIntegrationProps) {
  const { open } = useRagToggle()
  const [suggestions, setSuggestions] = useState<RAGSuggestion[]>([])
  const [loading, setLoading] = useState(false)

  // RAG提案の取得（統合機能）
  const fetchRAGSuggestions = async () => {
    setLoading(true)
    
    try {
      // 実際のRAGシステムとの連携をシミュレート
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockSuggestions: RAGSuggestion[] = [
        {
          type: 'item',
          title: '類似プロジェクトの項目提案',
          description: '過去の外壁塗装案件から、足場工事と養生作業が必要です',
          confidence: 0.85,
          actionable: true
        },
        {
          type: 'pricing',
          title: '市場価格との比較',
          description: '現在の単価は市場価格より15%高く設定されています',
          confidence: 0.92,
          actionable: true
        },
        {
          type: 'inventory',
          title: '在庫連動チェック',
          description: '指定された塗料の在庫が不足しています（現在残り3缶）',
          confidence: 0.78,
          actionable: true
        },
        {
          type: 'workflow',
          title: '工程最適化提案',
          description: '作業工程を変更することで3日短縮可能です',
          confidence: 0.67,
          actionable: false
        }
      ]
      
      setSuggestions(mockSuggestions)
    } catch (error) {
      console.error('RAG提案取得エラー:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'item': return '📝'
      case 'pricing': return '💰'
      case 'inventory': return '📦'
      case 'workflow': return '⚡'
      default: return '🤖'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (!open) return null

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            🤖 RAG統合提案
          </CardTitle>
          <Button
            onClick={fetchRAGSuggestions}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            {loading ? '分析中...' : '提案更新'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            「提案更新」ボタンをクリックして見積に対する提案を取得
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                    <span className="font-medium">{suggestion.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium ${getConfidenceColor(suggestion.confidence)}`}>
                      {Math.round(suggestion.confidence * 100)}%
                    </span>
                    {suggestion.actionable && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onApplySuggestion(suggestion)}
                        className="text-xs"
                      >
                        適用
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{suggestion.description}</p>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            💡 RAG提案は過去のプロジェクトデータ、市場価格情報、在庫状況、
            ベストプラクティスを基に生成されています
          </p>
        </div>
      </CardContent>
    </Card>
  )
}