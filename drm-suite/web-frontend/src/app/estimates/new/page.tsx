'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useEstimates, useRAGSuggestions } from '@/hooks/useEstimates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface EstimateItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  unit: string
  amount: number
  notes?: string
}

interface EstimateSection {
  id: string
  title: string
  items: EstimateItem[]
  subtotal: number
}

export default function NewEstimatePage() {
  const router = useRouter()
  const { createEstimate } = useEstimates()
  const { suggestItems, optimizePricing, loading: ragLoading } = useRAGSuggestions()
  
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [projectTitle, setProjectTitle] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('月末締め翌月末払い')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [sections, setSections] = useState<EstimateSection[]>([
    {
      id: '1',
      title: '基本工事',
      items: [],
      subtotal: 0
    }
  ])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const userRole = localStorage.getItem('userRole')
    if (!userRole) {
      router.push('/login')
    }
    // デフォルトの有効期限を30日後に設定
    const today = new Date()
    today.setDate(today.getDate() + 30)
    setValidUntil(today.toISOString().split('T')[0])
  }, [router])

  const addSection = () => {
    setSections([...sections, {
      id: Date.now().toString(),
      title: `追加工事 ${sections.length}`,
      items: [],
      subtotal: 0
    }])
  }

  const addItem = (sectionId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: [...section.items, {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            unitPrice: 0,
            unit: '式',
            amount: 0
          }]
        }
      }
      return section
    }))
  }

  const updateItem = (sectionId: string, itemId: string, field: keyof EstimateItem, value: any) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const updatedItems = section.items.map(item => {
          if (item.id === itemId) {
            const updatedItem = { ...item, [field]: value }
            // 金額を自動計算
            if (field === 'quantity' || field === 'unitPrice') {
              updatedItem.amount = updatedItem.quantity * updatedItem.unitPrice
            }
            return updatedItem
          }
          return item
        })
        const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0)
        return { ...section, items: updatedItems, subtotal }
      }
      return section
    }))
  }

  const removeItem = (sectionId: string, itemId: string) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        const updatedItems = section.items.filter(item => item.id !== itemId)
        const subtotal = updatedItems.reduce((sum, item) => sum + item.amount, 0)
        return { ...section, items: updatedItems, subtotal }
      }
      return section
    }))
  }

  const updateSectionTitle = (sectionId: string, title: string) => {
    setSections(sections.map(section =>
      section.id === sectionId ? { ...section, title } : section
    ))
  }

  const removeSection = (sectionId: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(section => section.id !== sectionId))
    }
  }

  const calculateTotal = () => {
    return sections.reduce((sum, section) => sum + section.subtotal, 0)
  }

  const handleSuggestItems = async () => {
    if (!projectTitle || !projectDescription) {
      alert('プロジェクト名と説明を入力してください')
      return
    }
    
    try {
      const suggestions = await suggestItems(projectTitle, projectDescription)
      if (suggestions && suggestions.length > 0) {
        setSections([{
          id: '1',
          title: '推奨項目',
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
    } catch (err) {
      console.error('AI提案エラー:', err)
    }
  }

  const handleOptimizePricing = async () => {
    try {
      const optimized = await optimizePricing(sections)
      if (optimized) {
        setSections(optimized)
      }
    } catch (err) {
      console.error('価格最適化エラー:', err)
    }
  }

  const handleSave = async (status: 'draft' | 'submitted' = 'draft') => {
    if (!customerName || !projectTitle) {
      alert('顧客名とプロジェクト名は必須です')
      return
    }

    setSaving(true)
    try {
      const estimateData = {
        estimateNo: `EST-${Date.now()}`,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        title: projectTitle,
        description: projectDescription,
        sections,
        subtotal: calculateTotal(),
        tax: calculateTotal() * 0.1,
        totalAmount: calculateTotal() * 1.1,
        validUntil,
        paymentTerms,
        deliveryDate,
        notes,
        status
      }

      await createEstimate(estimateData)
      router.push('/estimates')
    } catch (err) {
      console.error('見積保存エラー:', err)
      alert('見積の保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const subtotal = calculateTotal()
  const tax = subtotal * 0.1
  const total = subtotal + tax

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.push('/estimates')} className="text-gray-500 hover:text-gray-700">
                ← 見積一覧
              </button>
              <h1 className="text-2xl font-bold text-gray-900">新規見積作成</h1>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleSave('draft')}
                variant="outline"
                disabled={saving}
              >
                下書き保存
              </Button>
              <Button
                onClick={() => handleSave('submitted')}
                disabled={saving}
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
            {/* 顧客情報 */}
            <Card>
              <CardHeader>
                <CardTitle>顧客情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      顧客名 *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      電話番号
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      住所
                    </label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* プロジェクト情報 */}
            <Card>
              <CardHeader>
                <CardTitle>プロジェクト情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    件名 *
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      有効期限
                    </label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      納期
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      支払条件
                    </label>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option>月末締め翌月末払い</option>
                      <option>月末締め翌々月末払い</option>
                      <option>即日現金</option>
                      <option>分割払い</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 見積明細 */}
            {sections.map((section, sectionIndex) => (
              <Card key={section.id}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                      className="text-lg font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                    />
                    {sections.length > 1 && (
                      <button
                        onClick={() => removeSection(section.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        セクション削除
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 text-sm">品名・仕様</th>
                          <th className="text-center py-2 px-2 text-sm w-20">数量</th>
                          <th className="text-center py-2 px-2 text-sm w-20">単位</th>
                          <th className="text-right py-2 px-2 text-sm w-28">単価</th>
                          <th className="text-right py-2 px-2 text-sm w-28">金額</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.items.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-2 px-2">
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(section.id, item.id, 'description', e.target.value)}
                                className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="品名・仕様"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(section.id, item.id, 'quantity', Number(e.target.value))}
                                className="w-full px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                                min="0"
                              />
                            </td>
                            <td className="py-2 px-2">
                              <select
                                value={item.unit}
                                onChange={(e) => updateItem(section.id, item.id, 'unit', e.target.value)}
                                className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                <option>式</option>
                                <option>個</option>
                                <option>台</option>
                                <option>㎡</option>
                                <option>m</option>
                                <option>kg</option>
                                <option>時間</option>
                                <option>人日</option>
                              </select>
                            </td>
                            <td className="py-2 px-2">
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateItem(section.id, item.id, 'unitPrice', Number(e.target.value))}
                                className="w-full px-2 py-1 border rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                                min="0"
                              />
                            </td>
                            <td className="py-2 px-2 text-right font-medium">
                              ¥{item.amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-2">
                              <button
                                onClick={() => removeItem(section.id, item.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={6} className="py-2">
                            <button
                              onClick={() => addItem(section.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              + 明細追加
                            </button>
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={4} className="text-right py-2 font-medium">
                            小計：
                          </td>
                          <td className="text-right py-2 font-medium">
                            ¥{section.subtotal.toLocaleString()}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}

            <button
              onClick={addSection}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
            >
              + セクション追加
            </button>

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
            {/* 合計金額 */}
            <Card>
              <CardHeader>
                <CardTitle>合計金額</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">小計</span>
                  <span className="font-medium">¥{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">消費税（10%）</span>
                  <span className="font-medium">¥{tax.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">合計</span>
                    <span className="text-lg font-bold text-blue-600">
                      ¥{total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI支援 */}
            <Card>
              <CardHeader>
                <CardTitle>🤖 AI支援</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <button
                  onClick={handleSuggestItems}
                  disabled={ragLoading}
                  className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                >
                  {ragLoading ? '処理中...' : '項目を自動提案'}
                </button>
                <button
                  onClick={handleOptimizePricing}
                  disabled={ragLoading || sections.every(s => s.items.length === 0)}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  価格を最適化
                </button>
                <p className="text-xs text-gray-500">
                  AIがプロジェクト内容から最適な見積項目と価格を提案します
                </p>
              </CardContent>
            </Card>

            {/* クイックテンプレート */}
            <Card>
              <CardHeader>
                <CardTitle>テンプレート</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button className="w-full text-left px-3 py-2 border rounded-lg hover:bg-gray-50">
                  外壁塗装工事
                </button>
                <button className="w-full text-left px-3 py-2 border rounded-lg hover:bg-gray-50">
                  屋根修理工事
                </button>
                <button className="w-full text-left px-3 py-2 border rounded-lg hover:bg-gray-50">
                  リフォーム工事
                </button>
                <button className="w-full text-left px-3 py-2 border rounded-lg hover:bg-gray-50">
                  新築工事
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}