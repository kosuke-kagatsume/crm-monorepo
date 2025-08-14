'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CopyFromTemplateDialog } from '@/components/estimate/CopyFromTemplateDialog'
import { EstimateEditor } from '@/components/estimate/EstimateEditor'
import { Estimate } from '@/types/estimate-v2'

function NewEstimateContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  
  // URLパラメータから初期値を設定
  const projectId = searchParams.get('projectId')
  const customerFromUrl = searchParams.get('customer')
  const titleFromUrl = searchParams.get('title')
  
  const [basicInfo, setBasicInfo] = useState({
    title: titleFromUrl || '',
    customerId: '',
    storeId: '',
    method: '',
    structure: '',
    category: '',
    projectId: projectId || ''
  })
  const [showEditor, setShowEditor] = useState(false)
  
  useEffect(() => {
    // URLパラメータがある場合、顧客名から顧客IDを解決（実際はAPIから取得）
    if (customerFromUrl) {
      // モックで顧客IDを設定
      const customerMap: Record<string, string> = {
        '山田太郎': 'CUST-001',
        '鈴木一郎': 'CUST-002',
        '田中花子': 'CUST-003',
        '佐藤次郎': 'CUST-004'
      }
      setBasicInfo(prev => ({
        ...prev,
        customerId: customerMap[customerFromUrl] || 'CUST-001'
      }))
    }
  }, [customerFromUrl])

  const handleTemplateSelect = (template: any) => {
    // テンプレートから基本情報を設定
    setBasicInfo(prev => ({
      ...prev,
      title: template.name,
      method: template.items[0]?.name || '',
      category: template.category
    }))
    
    // エディタを表示してテンプレートの内容を反映
    setShowEditor(true)
  }

  const handleSave = async (estimate: Estimate) => {
    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...estimate,
          ...basicInfo
        })
      })
      
      if (!response.ok) throw new Error('Failed to create estimate')
      
      const data = await response.json()
      router.push(`/estimate/${data.id}`)
    } catch (error) {
      console.error('Failed to save estimate:', error)
      alert('見積の保存に失敗しました')
    }
  }

  const handleCancel = () => {
    if (confirm('編集内容は保存されません。よろしいですか？')) {
      router.push('/estimate')
    }
  }

  const handleProceed = () => {
    if (!basicInfo.title || !basicInfo.customerId || !basicInfo.storeId) {
      alert('必須項目を入力してください')
      return
    }
    setShowEditor(true)
  }

  if (showEditor) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                  ← キャンセル
                </button>
                <h1 className="text-2xl font-bold text-gray-900">新規見積作成</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EstimateEditor
            estimate={{
              id: '',
              customerId: basicInfo.customerId,
              title: basicInfo.title,
              storeId: basicInfo.storeId,
              method: basicInfo.method,
              structure: basicInfo.structure,
              category: basicInfo.category,
              versions: [{
                id: '1',
                label: 'v1',
                createdAt: new Date().toISOString(),
                items: []
              }],
              selectedVersionId: '1',
              createdBy: 'USER-CURRENT',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/estimate')} className="text-gray-500 hover:text-gray-700">
                ← 見積一覧
              </button>
              <h1 className="text-2xl font-bold text-gray-900">新規見積作成</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 案件連携情報 */}
          {projectId && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800">🔗 案件連携中</span>
                <span className="text-sm text-blue-600">案件ID: {projectId}</span>
              </div>
              {titleFromUrl && (
                <p className="text-xs text-blue-600 mt-1">案件名: {titleFromUrl}</p>
              )}
            </div>
          )}
          
          {/* 基本情報入力 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">見積タイトル *</label>
                <Input
                  value={basicInfo.title}
                  onChange={(e) => setBasicInfo({...basicInfo, title: e.target.value})}
                  placeholder="〇〇様邸 外壁塗装工事"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">顧客 *</label>
                <select
                  value={basicInfo.customerId}
                  onChange={(e) => setBasicInfo({...basicInfo, customerId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">選択してください</option>
                  <option value="CUST-001">山田太郎様</option>
                  <option value="CUST-002">鈴木一郎様</option>
                  <option value="CUST-003">田中花子様</option>
                  <option value="CUST-NEW">+ 新規顧客登録</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">店舗 *</label>
                <select
                  value={basicInfo.storeId}
                  onChange={(e) => setBasicInfo({...basicInfo, storeId: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">選択してください</option>
                  <option value="STORE-001">東京本店</option>
                  <option value="STORE-002">大阪支店</option>
                  <option value="STORE-003">名古屋支店</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">物件種別</label>
                  <select
                    value={basicInfo.category}
                    onChange={(e) => setBasicInfo({...basicInfo, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">選択してください</option>
                    <option value="戸建住宅">戸建住宅</option>
                    <option value="マンション">マンション</option>
                    <option value="リフォーム">リフォーム</option>
                    <option value="商業施設">商業施設</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">構造</label>
                  <select
                    value={basicInfo.structure}
                    onChange={(e) => setBasicInfo({...basicInfo, structure: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">選択してください</option>
                    <option value="木造2階建て">木造2階建て</option>
                    <option value="木造平屋">木造平屋</option>
                    <option value="鉄骨造">鉄骨造</option>
                    <option value="RC造">RC造</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">工法</label>
                <Input
                  value={basicInfo.method}
                  onChange={(e) => setBasicInfo({...basicInfo, method: e.target.value})}
                  placeholder="シリコン塗装、瓦交換など"
                />
              </div>
            </CardContent>
          </Card>

          {/* テンプレート選択 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>テンプレートから作成</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                過去の見積や標準テンプレートから項目をコピーできます
              </p>
              <Button
                onClick={() => setShowTemplateDialog(true)}
                variant="outline"
                className="w-full"
              >
                📋 テンプレートから選択
              </Button>
            </CardContent>
          </Card>

          {/* アクションボタン */}
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => router.push('/estimate')}
              variant="outline"
            >
              キャンセル
            </Button>
            <Button onClick={handleProceed}>
              次へ（明細入力）
            </Button>
          </div>
        </div>
      </main>

      {/* テンプレート選択ダイアログ */}
      <CopyFromTemplateDialog
        isOpen={showTemplateDialog}
        onClose={() => setShowTemplateDialog(false)}
        onSelect={(template) => {
          handleTemplateSelect(template)
          setShowTemplateDialog(false)
        }}
      />
    </div>
  )
}

export default function NewEstimatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    }>
      <NewEstimateContent />
    </Suspense>
  )
}