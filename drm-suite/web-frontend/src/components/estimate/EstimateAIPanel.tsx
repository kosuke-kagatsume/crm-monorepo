'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EstimateSection } from './types'

interface EstimateAIPanelProps {
  projectTitle: string
  projectDescription: string
  sections: EstimateSection[]
  onSuggestItems: (title: string, description: string) => Promise<void>
  onOptimizePricing: (sections: EstimateSection[]) => Promise<void>
  loading?: boolean
}

export function EstimateAIPanel({
  projectTitle,
  projectDescription,
  sections,
  onSuggestItems,
  onOptimizePricing,
  loading
}: EstimateAIPanelProps) {
  const handleSuggestItems = async () => {
    if (!projectTitle || !projectDescription) {
      alert('プロジェクト名と説明を入力してください')
      return
    }
    await onSuggestItems(projectTitle, projectDescription)
  }

  const handleOptimizePricing = async () => {
    await onOptimizePricing(sections)
  }

  const hasItems = sections.some(s => s.items.length > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>🤖 AI支援</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          onClick={handleSuggestItems}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700"
          variant="default"
        >
          {loading ? '処理中...' : '項目を自動提案'}
        </Button>
        <Button
          onClick={handleOptimizePricing}
          disabled={loading || !hasItems}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
          variant="default"
        >
          価格を最適化
        </Button>
        <p className="text-xs text-gray-500">
          AIがプロジェクト内容から最適な見積項目と価格を提案します
        </p>
      </CardContent>
    </Card>
  )
}