'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  EstimateForm,
  CustomerInfoForm,
  ProjectInfoForm,
  EstimateSummaryCard,
  EstimateAIPanel,
  EstimateTemplatePanel,
  EstimateRAGIntegration,
  EstimateInventoryCheck,
  EstimateData,
  EstimateSection
} from '@/components/estimate'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEstimateModule } from '@/hooks/useEstimateModule'

export default function EstimateDemoPage() {
  const router = useRouter()
  const { createEstimate, suggestItems, optimizePricing, loading } = useEstimateModule()

  const [customerInfo, setCustomerInfo] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: ''
  })

  const [projectInfo, setProjectInfo] = useState({
    title: '',
    description: '',
    validUntil: '',
    deliveryDate: '',
    paymentTerms: '月末締め翌月末払い'
  })

  const [sections, setSections] = useState<EstimateSection[]>([{
    id: '1',
    title: '基本工事',
    items: [],
    subtotal: 0
  }])

  const [notes, setNotes] = useState('')
  const [inventoryItems, setInventoryItems] = useState<any[]>([])

  // 初期化時に有効期限を30日後に設定
  useState(() => {
    const today = new Date()
    today.setDate(today.getDate() + 30)
    setProjectInfo(prev => ({
      ...prev,
      validUntil: today.toISOString().split('T')[0]
    }))
  })

  const handleCustomerInfoChange = useCallback((field: string, value: string) => {
    setCustomerInfo(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleProjectInfoChange = useCallback((field: string, value: string) => {
    setProjectInfo(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSectionsChange = useCallback((newSections: EstimateSection[]) => {
    setSections(newSections)
  }, [])

  const calculateTotal = useCallback(() => {
    return sections.reduce((sum, section) => sum + section.subtotal, 0)
  }, [sections])

  const subtotal = calculateTotal()
  const tax = subtotal * 0.1
  const total = subtotal + tax

  const handleAISuggest = useCallback(async (title: string, description: string) => {
    try {
      const suggestions = await suggestItems(title, description)
      if (suggestions && suggestions.length > 0) {
        setSections([{
          id: '1',
          title: 'AI推奨項目',
          items: suggestions.map((item: any, index: number) => ({
            id: Date.now().toString() + index,
            description: item.description,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            unit: item.unit || '式',
            amount: (item.quantity || 1) * (item.unitPrice || 0),
            notes: item.notes
          })),
          subtotal: suggestions.reduce((sum: number, item: any) => 
            sum + (item.quantity || 1) * (item.unitPrice || 0), 0)
        }])
      }
    } catch (error) {
      console.error('AI提案エラー:', error)
      alert('AI提案の取得に失敗しました')
    }
  }, [suggestItems])

  const handleOptimizePricing = useCallback(async (currentSections: EstimateSection[]) => {
    try {
      const optimized = await optimizePricing(currentSections)
      if (optimized) {
        setSections(optimized)
      }
    } catch (error) {
      console.error('価格最適化エラー:', error)
      alert('価格最適化に失敗しました')
    }
  }, [optimizePricing])

  const handleTemplateSelect = useCallback((template: any) => {
    setSections(template.sections)
    setProjectInfo(prev => ({
      ...prev,
      title: template.name,
      description: `${template.name}の詳細内容`
    }))
  }, [])

  const handleRAGSuggestion = useCallback((suggestion: any) => {
    console.log('RAG提案を適用:', suggestion)
    alert(`RAG提案「${suggestion.title}」が適用されました`)
  }, [])

  const handleInventoryUpdate = useCallback((items: any[]) => {
    setInventoryItems(items)
  }, [])

  const handleSave = async (status: 'draft' | 'submitted' = 'draft') => {
    if (!customerInfo.customerName || !projectInfo.title) {
      alert('顧客名とプロジェクト名は必須です')
      return
    }

    try {
      const estimateData: Omit<EstimateData, 'id' | 'createdAt' | 'updatedAt'> = {
        estimateNo: `EST-DEMO-${Date.now()}`,
        customerName: customerInfo.customerName,
        customerEmail: customerInfo.customerEmail,
        customerPhone: customerInfo.customerPhone,
        customerAddress: customerInfo.customerAddress,
        title: projectInfo.title,
        description: projectInfo.description,
        sections,
        subtotal,
        tax,
        totalAmount: total,
        validUntil: projectInfo.validUntil,
        paymentTerms: projectInfo.paymentTerms,
        deliveryDate: projectInfo.deliveryDate,
        notes,
        status
      }

      await createEstimate(estimateData)
      alert(`見積が${status === 'draft' ? '下書き保存' : '承認申請'}されました`)
    } catch (error) {
      console.error('見積保存エラー:', error)
      alert('見積の保存に失敗しました')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/home')} className="text-gray-500 hover:text-gray-700">
                ← ホーム
              </button>
              <h1 className="text-2xl font-bold text-gray-900">見積モジュールデモ</h1>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleSave('draft')}
                variant="outline"
                disabled={loading}
              >
                下書き保存
              </Button>
              <Button
                onClick={() => handleSave('submitted')}
                disabled={loading}
              >
                承認申請
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* メインフォーム */}
          <div className="lg:col-span-2 space-y-6">
            {/* 説明カード */}
            <Card>
              <CardHeader>
                <CardTitle>✅ 見積モジュール復元完了</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>• <strong>再利用可能なコンポーネント</strong> - 顧客情報、プロジェクト情報、見積フォームを分離</p>
                  <p>• <strong>API統合</strong> - Next.js Route Handlers による完全なCRUD操作</p>
                  <p>• <strong>AI支援機能</strong> - 項目自動提案と価格最適化</p>
                  <p>• <strong>RAG統合</strong> - 過去データと市場価格に基づく提案</p>
                  <p>• <strong>在庫連動</strong> - リアルタイム在庫チェックと不足アラート</p>
                  <p>• <strong>承認ワークフロー</strong> - 下書き → 承認申請 → 承認済み → PDF生成</p>
                </div>
              </CardContent>
            </Card>

            <CustomerInfoForm 
              data={customerInfo}
              onChange={handleCustomerInfoChange}
            />

            <ProjectInfoForm 
              data={projectInfo}
              onChange={handleProjectInfoChange}
            />

            <EstimateForm 
              initialSections={sections}
              onSectionsChange={handleSectionsChange}
            />

            {/* 備考 */}
            <Card>
              <CardHeader>
                <CardTitle>備考</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="備考・特記事項を入力..."
                />
              </CardContent>
            </Card>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            <EstimateSummaryCard 
              subtotal={subtotal}
              tax={tax}
              total={total}
            />

            <EstimateAIPanel 
              projectTitle={projectInfo.title}
              projectDescription={projectInfo.description}
              sections={sections}
              onSuggestItems={handleAISuggest}
              onOptimizePricing={handleOptimizePricing}
              loading={loading}
            />

            <EstimateTemplatePanel 
              onSelectTemplate={handleTemplateSelect}
              disabled={loading}
            />

            <EstimateRAGIntegration 
              estimateData={{ customerInfo, projectInfo, sections }}
              onApplySuggestion={handleRAGSuggestion}
            />

            <EstimateInventoryCheck 
              sections={sections}
              onInventoryUpdate={handleInventoryUpdate}
            />
          </div>
        </div>
      </main>
    </div>
  )
}