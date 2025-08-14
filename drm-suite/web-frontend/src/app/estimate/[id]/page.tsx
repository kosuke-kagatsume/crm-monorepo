'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EstimateEditor } from '@/components/estimate/EstimateEditor'
import { EstimateView } from '@/components/estimate/EstimateView'
import { Estimate, EstimateVersion, EstimateItem } from '@/types/estimate-v2'

interface TabPanelProps {
  children: React.ReactNode
  value: string
  currentTab: string
}

function TabPanel({ children, value, currentTab }: TabPanelProps) {
  if (value !== currentTab) return null
  return <div>{children}</div>
}

export default function EstimateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTab, setCurrentTab] = useState(searchParams.get('tab') || 'detail')
  
  // ショートカット用ダイアログ状態
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [showChangeOrderDialog, setShowChangeOrderDialog] = useState(false)
  const [showBillingDialog, setShowBillingDialog] = useState(false)
  const [showMergeDialog, setShowMergeDialog] = useState(false)
  const [showShortcutHelp, setShowShortcutHelp] = useState(false)

  useEffect(() => {
    fetchEstimate()
  }, [params.id])

  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // 入力フィールドにフォーカスがある場合は無効
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement) {
        return
      }

      // Cmd/Ctrl + Shift + ? でヘルプ表示
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '?') {
        e.preventDefault()
        setShowShortcutHelp(!showShortcutHelp)
        return
      }

      // 見積画面専用ショートカット
      switch (e.key.toUpperCase()) {
        case 'E':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            setShowProgressDialog(true)
          }
          break
        case 'C':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            setShowChangeOrderDialog(true)
          }
          break
        case 'B':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            setShowBillingDialog(true)
          }
          break
        case 'M':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            setShowMergeDialog(true)
          }
          break
        // N は /estimate 内では無効
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [showShortcutHelp])

  const fetchEstimate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/estimates/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch estimate')
      const data = await response.json()
      setEstimate(data)
    } catch (error) {
      console.error('Failed to fetch estimate:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (updatedEstimate: Estimate) => {
    try {
      const response = await fetch(`/api/estimates/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedEstimate)
      })
      if (!response.ok) throw new Error('Failed to update estimate')
      const data = await response.json()
      setEstimate(data)
      setCurrentTab('detail')
      alert('見積を更新しました')
    } catch (error) {
      console.error('Failed to save estimate:', error)
      alert('見積の更新に失敗しました')
    }
  }

  const handleApprove = async () => {
    if (!confirm('この見積を承認しますか？')) return
    
    try {
      const response = await fetch(`/api/estimates/${params.id}/submit-approval`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to submit for approval')
      await fetchEstimate()
      alert('承認申請を送信しました')
    } catch (error) {
      console.error('Failed to approve:', error)
      alert('承認申請に失敗しました')
    }
  }

  const handleExportPDF = async () => {
    try {
      const response = await fetch(`/api/estimates/${params.id}/pdf`)
      if (!response.ok) throw new Error('Failed to generate PDF')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `見積書_${estimate?.title}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('PDF出力に失敗しました')
    }
  }

  const handleCreateContract = async () => {
    const provider = prompt('契約書プロバイダーを選択してください (gmo/cloudsign):', 'cloudsign')
    if (!provider || !['gmo', 'cloudsign'].includes(provider)) {
      alert('有効なプロバイダーを選択してください')
      return
    }

    try {
      const response = await fetch(`/api/estimates/${params.id}/export-contract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      })
      if (!response.ok) throw new Error('Failed to create contract')
      const data = await response.json()
      alert(`契約書を作成しました: ${data.contract.url}`)
      await fetchEstimate()
    } catch (error) {
      console.error('Failed to create contract:', error)
      alert('契約書作成に失敗しました')
    }
  }

  const calculateTotals = (version: EstimateVersion) => {
    const items = version.items
    const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0)
    const costTotal = items.reduce((sum, item) => sum + (item.qty * (item.cost || 0)), 0)
    const profit = subtotal - costTotal
    const profitRate = subtotal > 0 ? (profit / subtotal * 100) : 0
    
    return {
      subtotal,
      tax: subtotal * 0.1,
      total: subtotal * 1.1,
      costTotal,
      profit,
      profitRate
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">見積が見つかりません</p>
          <Button onClick={() => router.push('/estimate')} className="mt-4">
            一覧に戻る
          </Button>
        </div>
      </div>
    )
  }

  const currentVersion = estimate.versions.find(v => v.id === estimate.selectedVersionId) || estimate.versions[0]
  const totals = calculateTotals(currentVersion)

  const tabs = [
    { id: 'detail', label: '明細' },
    { id: 'cost', label: '原価' },
    { id: 'approval', label: '承認' },
    { id: 'contract', label: '契約' },
    { id: 'payment', label: '入金計画' },
    { id: 'history', label: '履歴' },
    { id: 'edit', label: '編集' }
  ]

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
              <h1 className="text-2xl font-bold text-gray-900">{estimate.title}</h1>
            </div>
            <div className="flex gap-2">
              {estimate.approval?.status === 'draft' && (
                <Button onClick={handleApprove} variant="outline">
                  承認申請
                </Button>
              )}
              {estimate.approval?.status === 'approved' && (
                <>
                  <Button onClick={handleExportPDF} variant="outline">
                    PDF出力
                  </Button>
                  {!estimate.contract && (
                    <Button onClick={handleCreateContract}>
                      契約書作成
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* タブ */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  currentTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            {/* 明細タブ */}
            <TabPanel value="detail" currentTab={currentTab}>
              <EstimateView
                estimate={estimate}
                onEdit={() => setCurrentTab('edit')}
                onApprove={handleApprove}
                onExportPDF={handleExportPDF}
                onCreateContract={handleCreateContract}
              />
            </TabPanel>

            {/* 原価タブ */}
            <TabPanel value="cost" currentTab={currentTab}>
              <Card>
                <CardHeader>
                  <CardTitle>原価分析</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">売上合計</p>
                        <p className="text-2xl font-bold">¥{totals.subtotal.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">原価合計</p>
                        <p className="text-2xl font-bold">¥{totals.costTotal.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">粗利益</p>
                        <p className="text-2xl font-bold text-green-600">¥{totals.profit.toLocaleString()}</p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">粗利率</p>
                        <p className="text-2xl font-bold text-green-600">{totals.profitRate.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-3">項目別原価</h3>
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">項目</th>
                            <th className="text-right py-2">売価</th>
                            <th className="text-right py-2">原価</th>
                            <th className="text-right py-2">粗利</th>
                            <th className="text-right py-2">粗利率</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentVersion.items.map(item => {
                            const revenue = item.qty * item.price
                            const cost = item.qty * (item.cost || 0)
                            const profit = revenue - cost
                            const rate = revenue > 0 ? (profit / revenue * 100) : 0
                            
                            return (
                              <tr key={item.id} className="border-b">
                                <td className="py-2">{item.name}</td>
                                <td className="text-right">¥{revenue.toLocaleString()}</td>
                                <td className="text-right">¥{cost.toLocaleString()}</td>
                                <td className="text-right">¥{profit.toLocaleString()}</td>
                                <td className="text-right">
                                  <span className={rate >= 30 ? 'text-green-600' : rate >= 20 ? 'text-yellow-600' : 'text-red-600'}>
                                    {rate.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            {/* 承認タブ */}
            <TabPanel value="approval" currentTab={currentTab}>
              <Card>
                <CardHeader>
                  <CardTitle>承認ワークフロー</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">現在のステータス</p>
                        <p className="text-sm text-gray-600">最終更新: {new Date(estimate.updatedAt).toLocaleString('ja-JP')}</p>
                      </div>
                      <Badge className={
                        estimate.approval?.status === 'approved' ? 'bg-green-100 text-green-800' :
                        estimate.approval?.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        estimate.approval?.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {estimate.approval?.status === 'approved' ? '承認済み' :
                         estimate.approval?.status === 'pending' ? '承認待ち' :
                         estimate.approval?.status === 'rejected' ? '却下' : '下書き'}
                      </Badge>
                    </div>

                    {estimate.approval?.steps && estimate.approval.steps.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-3">承認ステップ</h3>
                        <div className="space-y-2">
                          {estimate.approval.steps.map((step, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {step.role === 'manager' ? 'マネージャー' :
                                     step.role === 'director' ? 'ディレクター' : 'CFO'}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    承認閾値: ¥{step.threshold.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline">未承認</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            {/* 契約タブ */}
            <TabPanel value="contract" currentTab={currentTab}>
              <Card>
                <CardHeader>
                  <CardTitle>契約情報</CardTitle>
                </CardHeader>
                <CardContent>
                  {estimate.contract ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">契約プロバイダー</p>
                            <p className="text-sm text-gray-600">
                              {estimate.contract.provider === 'gmo' ? 'GMO Sign' : 'CloudSign'}
                            </p>
                          </div>
                          <Badge className={
                            estimate.contract.status === 'signed' ? 'bg-green-100 text-green-800' :
                            estimate.contract.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {estimate.contract.status === 'signed' ? '締結済み' :
                             estimate.contract.status === 'sent' ? '送信済み' : '下書き'}
                          </Badge>
                        </div>
                      </div>
                      {estimate.contract.url && (
                        <a
                          href={estimate.contract.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <p className="font-medium text-blue-600">契約書を表示</p>
                          <p className="text-sm text-gray-600">{estimate.contract.url}</p>
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">契約書はまだ作成されていません</p>
                      {estimate.approval?.status === 'approved' && (
                        <Button onClick={handleCreateContract}>
                          契約書を作成
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabPanel>

            {/* 入金計画タブ */}
            <TabPanel value="payment" currentTab={currentTab}>
              <Card>
                <CardHeader>
                  <CardTitle>入金計画</CardTitle>
                </CardHeader>
                <CardContent>
                  {estimate.paymentPlan ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        {estimate.paymentPlan.depositPct && (
                          <div className="p-4 border rounded-lg">
                            <p className="text-sm text-gray-600">着工金</p>
                            <p className="text-xl font-bold">{estimate.paymentPlan.depositPct}%</p>
                            <p className="text-sm text-gray-500">
                              ¥{Math.floor(totals.total * estimate.paymentPlan.depositPct / 100).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {estimate.paymentPlan.middlePct && (
                          <div className="p-4 border rounded-lg">
                            <p className="text-sm text-gray-600">中間金</p>
                            <p className="text-xl font-bold">{estimate.paymentPlan.middlePct}%</p>
                            <p className="text-sm text-gray-500">
                              ¥{Math.floor(totals.total * estimate.paymentPlan.middlePct / 100).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {estimate.paymentPlan.finalPct && (
                          <div className="p-4 border rounded-lg">
                            <p className="text-sm text-gray-600">最終金</p>
                            <p className="text-xl font-bold">{estimate.paymentPlan.finalPct}%</p>
                            <p className="text-sm text-gray-500">
                              ¥{Math.floor(totals.total * estimate.paymentPlan.finalPct / 100).toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">入金計画は設定されていません</p>
                  )}
                </CardContent>
              </Card>
            </TabPanel>

            {/* 履歴タブ */}
            <TabPanel value="history" currentTab={currentTab}>
              <Card>
                <CardHeader>
                  <CardTitle>更新履歴</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {estimate.versions.map((version, index) => (
                      <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{version.label}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(version.createdAt).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        {version.id === estimate.selectedVersionId && (
                          <Badge>現在</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabPanel>

            {/* 編集タブ */}
            <TabPanel value="edit" currentTab={currentTab}>
              <EstimateEditor
                estimate={estimate}
                onSave={handleSave}
                onCancel={() => setCurrentTab('detail')}
              />
            </TabPanel>
          </div>

          {/* 右サイドバー - VendorRecommend */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>🏢 よく使う協力会社</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">建材商事株式会社</p>
                        <p className="text-sm text-gray-600">外壁材・塗料</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">95%</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">取引実績: 234件</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">住設サプライ</p>
                        <p className="text-sm text-gray-600">キッチン・バス</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">88%</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">取引実績: 156件</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">リフォーム資材センター</p>
                        <p className="text-sm text-gray-600">総合建材</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">82%</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">取引実績: 89件</p>
                  </div>
                  
                  <div className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">プロ工具商会</p>
                        <p className="text-sm text-gray-600">工具・機材</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">76%</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">取引実績: 67件</p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700">
                    💡 スコアは納期遵守率、品質評価、価格競争力から算出
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 在庫状況 */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>📦 在庫状況</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {currentVersion.items.filter(item => item.skuId).map(item => (
                    <div key={item.id} className="p-2 border rounded">
                      <p className="text-sm font-medium">{item.name}</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-gray-600">必要: {item.qty}{item.unit}</span>
                        <Badge className="bg-green-100 text-green-800 text-xs">在庫あり</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-3" variant="outline" size="sm">
                  在庫を予約
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* E: 出来高入力ダイアログ */}
      {showProgressDialog && (
        <ProgressInputDialog
          estimate={estimate}
          onClose={() => setShowProgressDialog(false)}
          onSave={(data) => {
            console.log('出来高データ保存:', data)
            alert('出来高を記録しました（将来ledger連動）')
            setShowProgressDialog(false)
          }}
        />
      )}

      {/* C: 変更工事（CO）起票ダイアログ */}
      {showChangeOrderDialog && (
        <ChangeOrderDialog
          estimate={estimate}
          onClose={() => setShowChangeOrderDialog(false)}
          onCreate={(changeOrder) => {
            console.log('変更工事作成:', changeOrder)
            alert(`変更工事を起票しました: ${changeOrder.title}`)
            setShowChangeOrderDialog(false)
          }}
        />
      )}

      {/* B: 請求案作成ダイアログ */}
      {showBillingDialog && (
        <BillingProposalDialog
          estimate={estimate}
          onClose={() => setShowBillingDialog(false)}
          onCreate={(proposal) => {
            console.log('請求案作成:', proposal)
            alert('請求案を作成しました')
            setShowBillingDialog(false)
          }}
        />
      )}

      {/* M: バージョン台帳合流ダイアログ */}
      {showMergeDialog && (
        <MergeLedgerDialog
          estimate={estimate}
          onClose={() => setShowMergeDialog(false)}
          onMerge={(versionId) => {
            console.log('台帳合流:', versionId)
            alert('選択バージョンを台帳へ合流しました（aftercare用）')
            setShowMergeDialog(false)
          }}
        />
      )}

      {/* ショートカットヘルプ */}
      {showShortcutHelp && (
        <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-xl border p-4 max-w-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold">ショートカット（見積画面）</h3>
            <button 
              onClick={() => setShowShortcutHelp(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <kbd className="px-2 py-1 bg-gray-100 rounded">E</kbd>
              <span>出来高入力</span>
            </div>
            <div className="flex justify-between">
              <kbd className="px-2 py-1 bg-gray-100 rounded">C</kbd>
              <span>変更工事（CO）起票</span>
            </div>
            <div className="flex justify-between">
              <kbd className="px-2 py-1 bg-gray-100 rounded">B</kbd>
              <span>請求案作成</span>
            </div>
            <div className="flex justify-between">
              <kbd className="px-2 py-1 bg-gray-100 rounded">M</kbd>
              <span>台帳へ合流</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <kbd className="px-2 py-1 bg-gray-100 rounded line-through">N</kbd>
              <span className="line-through">新規顧客（無効）</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">⌘</kbd>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">⇧</kbd>
            <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">?</kbd>
            でヘルプ表示
          </div>
        </div>
      )}
    </div>
  )
}

// E: 出来高入力ダイアログ
function ProgressInputDialog({ 
  estimate, 
  onClose, 
  onSave 
}: { 
  estimate: Estimate | null
  onClose: () => void
  onSave: (data: any) => void 
}) {
  const [progressData, setProgressData] = useState<Record<string, number>>({});
  const currentVersion = estimate?.versions.find(v => v.id === estimate.selectedVersionId) || estimate?.versions[0]

  if (!estimate || !currentVersion) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>出来高入力</CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm">×</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                各項目の進捗率を入力してください（0-100%）
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ※将来的にledgerシステムと連動予定
              </p>
            </div>
            
            <div className="space-y-3">
              {currentVersion.items.map(item => {
                const progress = progressData[item.id] || 0
                const completedAmount = Math.floor(item.qty * item.price * progress / 100)
                
                return (
                  <div key={item.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          予定金額: ¥{(item.qty * item.price).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {progress}% 完了
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={progress}
                        onChange={(e) => setProgressData({
                          ...progressData,
                          [item.id]: Number(e.target.value)
                        })}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgressData({
                          ...progressData,
                          [item.id]: Math.min(100, Math.max(0, Number(e.target.value)))
                        })}
                        className="w-20 text-center"
                      />
                      <span className="text-sm font-medium text-green-600">
                        ¥{completedAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">出来高合計</span>
                <span className="text-xl font-bold text-blue-600">
                  ¥{Object.entries(progressData).reduce((sum, [itemId, progress]) => {
                    const item = currentVersion.items.find(i => i.id === itemId)
                    if (!item) return sum
                    return sum + Math.floor(item.qty * item.price * progress / 100)
                  }, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onClose} variant="outline">キャンセル</Button>
            <Button onClick={() => onSave(progressData)}>保存</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// C: 変更工事（CO）起票ダイアログ
function ChangeOrderDialog({ 
  estimate, 
  onClose, 
  onCreate 
}: { 
  estimate: Estimate | null
  onClose: () => void
  onCreate: (changeOrder: any) => void 
}) {
  const [coTitle, setCoTitle] = useState('')
  const [coReason, setCoReason] = useState('')
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [itemChanges, setItemChanges] = useState<Record<string, { qty?: number; price?: number }>>({})
  
  const currentVersion = estimate?.versions.find(v => v.id === estimate.selectedVersionId) || estimate?.versions[0]

  if (!estimate || !currentVersion) return null

  const calculateDifference = () => {
    let difference = 0
    selectedItems.forEach(itemId => {
      const item = currentVersion.items.find(i => i.id === itemId)
      if (!item) return
      
      const changes = itemChanges[itemId] || {}
      const newQty = changes.qty ?? item.qty
      const newPrice = changes.price ?? item.price
      const original = item.qty * item.price
      const changed = newQty * newPrice
      difference += (changed - original)
    })
    return difference
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-3xl max-h-[80vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>変更工事（CO）起票</CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm">×</Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">変更工事名</label>
                <Input
                  value={coTitle}
                  onChange={(e) => setCoTitle(e.target.value)}
                  placeholder="追加工事 - キッチン仕様変更"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">変更理由</label>
                <Input
                  value={coReason}
                  onChange={(e) => setCoReason(e.target.value)}
                  placeholder="お客様要望による仕様変更"
                />
              </div>
            </div>
            
            <div className="border rounded-lg p-3">
              <h4 className="font-medium mb-3">変更対象項目を選択</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currentVersion.items.map(item => {
                  const isSelected = selectedItems.has(item.id)
                  const changes = itemChanges[item.id] || {}
                  
                  return (
                    <div key={item.id} className={`p-3 border rounded-lg ${
                      isSelected ? 'bg-blue-50 border-blue-300' : ''
                    }`}>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            const newSet = new Set(selectedItems)
                            if (e.target.checked) {
                              newSet.add(item.id)
                            } else {
                              newSet.delete(item.id)
                              const newChanges = { ...itemChanges }
                              delete newChanges[item.id]
                              setItemChanges(newChanges)
                            }
                            setSelectedItems(newSet)
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <div className="flex gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">数量:</span>
                              <span className="text-sm line-through">{item.qty}</span>
                              <Input
                                type="number"
                                value={changes.qty ?? item.qty}
                                onChange={(e) => setItemChanges({
                                  ...itemChanges,
                                  [item.id]: {
                                    ...changes,
                                    qty: Number(e.target.value)
                                  }
                                })}
                                disabled={!isSelected}
                                className="w-20 h-7 text-sm"
                              />
                              <span className="text-sm">{item.unit}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">単価:</span>
                              <span className="text-sm line-through">¥{item.price.toLocaleString()}</span>
                              <Input
                                type="number"
                                value={changes.price ?? item.price}
                                onChange={(e) => setItemChanges({
                                  ...itemChanges,
                                  [item.id]: {
                                    ...changes,
                                    price: Number(e.target.value)
                                  }
                                })}
                                disabled={!isSelected}
                                className="w-24 h-7 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">変更差額</span>
                <span className={`text-xl font-bold ${
                  calculateDifference() >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {calculateDifference() >= 0 ? '+' : ''}¥{calculateDifference().toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onClose} variant="outline">キャンセル</Button>
            <Button 
              onClick={() => onCreate({
                title: coTitle,
                reason: coReason,
                items: Array.from(selectedItems).map(id => ({
                  itemId: id,
                  changes: itemChanges[id]
                })),
                difference: calculateDifference()
              })}
              disabled={!coTitle || selectedItems.size === 0}
            >
              起票
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// B: 請求案作成ダイアログ
function BillingProposalDialog({ 
  estimate, 
  onClose, 
  onCreate 
}: { 
  estimate: Estimate | null
  onClose: () => void
  onCreate: (proposal: any) => void 
}) {
  const [billingType, setBillingType] = useState<'deposit' | 'middle' | 'final'>('deposit')
  const [customAmount, setCustomAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  
  if (!estimate) return null
  
  const currentVersion = estimate.versions.find(v => v.id === estimate.selectedVersionId) || estimate.versions[0]
  const totals = currentVersion.items.reduce((sum, item) => sum + (item.qty * item.price), 0) * 1.1
  
  const getDefaultAmount = () => {
    if (!estimate.paymentPlan) return totals
    
    switch (billingType) {
      case 'deposit':
        return Math.floor(totals * (estimate.paymentPlan.depositPct || 30) / 100)
      case 'middle':
        return Math.floor(totals * (estimate.paymentPlan.middlePct || 40) / 100)
      case 'final':
        return Math.floor(totals * (estimate.paymentPlan.finalPct || 30) / 100)
      default:
        return 0
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>請求案作成</CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm">×</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {estimate.paymentPlan && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-2">入金計画</p>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>着工金: {estimate.paymentPlan.depositPct}%</span>
                    <span>¥{Math.floor(totals * estimate.paymentPlan.depositPct / 100).toLocaleString()}</span>
                  </div>
                  {estimate.paymentPlan.middlePct && (
                    <div className="flex justify-between">
                      <span>中間金: {estimate.paymentPlan.middlePct}%</span>
                      <span>¥{Math.floor(totals * estimate.paymentPlan.middlePct / 100).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>最終金: {estimate.paymentPlan.finalPct}%</span>
                    <span>¥{Math.floor(totals * (estimate.paymentPlan.finalPct || 0) / 100).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-2">請求種別</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setBillingType('deposit')}
                  className={`p-2 border rounded-lg text-sm ${
                    billingType === 'deposit' ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                >
                  着工金
                </button>
                <button
                  onClick={() => setBillingType('middle')}
                  className={`p-2 border rounded-lg text-sm ${
                    billingType === 'middle' ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                >
                  中間金
                </button>
                <button
                  onClick={() => setBillingType('final')}
                  className={`p-2 border rounded-lg text-sm ${
                    billingType === 'final' ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                >
                  最終金
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">請求金額</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={customAmount || getDefaultAmount()}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="金額を入力"
                />
                <Button
                  onClick={() => setCustomAmount(String(getDefaultAmount()))}
                  variant="outline"
                  size="sm"
                >
                  自動計算
                </Button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">支払期日</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">備考</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
                placeholder="請求に関する備考"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onClose} variant="outline">キャンセル</Button>
            <Button onClick={() => onCreate({
              type: billingType,
              amount: Number(customAmount || getDefaultAmount()),
              dueDate,
              notes
            })}>
              作成
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// M: バージョン台帳合流ダイアログ
function MergeLedgerDialog({ 
  estimate, 
  onClose, 
  onMerge 
}: { 
  estimate: Estimate | null
  onClose: () => void
  onMerge: (versionId: string) => void 
}) {
  const [selectedVersion, setSelectedVersion] = useState('')
  const [mergeNotes, setMergeNotes] = useState('')
  const [mergeType, setMergeType] = useState<'aftercare' | 'maintenance' | 'warranty'>('aftercare')
  
  if (!estimate) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>台帳へ合流</CardTitle>
            <Button onClick={onClose} variant="ghost" size="sm">×</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                選択したバージョンを台帳システムへ登録します
              </p>
              <p className="text-xs text-blue-600 mt-1">
                アフターケア・メンテナンス管理で使用されます
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">バージョン選択</label>
              <div className="space-y-2">
                {estimate.versions.map(version => (
                  <button
                    key={version.id}
                    onClick={() => setSelectedVersion(version.id)}
                    className={`w-full p-3 border rounded-lg text-left transition-all ${
                      selectedVersion === version.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{version.label}</p>
                        <p className="text-sm text-gray-600">
                          作成日: {new Date(version.createdAt).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      {version.id === estimate.selectedVersionId && (
                        <Badge>現在選択中</Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">合流目的</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMergeType('aftercare')}
                  className={`p-2 border rounded-lg text-sm ${
                    mergeType === 'aftercare' ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                >
                  アフターケア
                </button>
                <button
                  onClick={() => setMergeType('maintenance')}
                  className={`p-2 border rounded-lg text-sm ${
                    mergeType === 'maintenance' ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                >
                  メンテナンス
                </button>
                <button
                  onClick={() => setMergeType('warranty')}
                  className={`p-2 border rounded-lg text-sm ${
                    mergeType === 'warranty' ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                >
                  保証管理
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">メモ</label>
              <textarea
                value={mergeNotes}
                onChange={(e) => setMergeNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
                rows={3}
                placeholder="台帳登録に関するメモ"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={onClose} variant="outline">キャンセル</Button>
            <Button 
              onClick={() => onMerge(selectedVersion)}
              disabled={!selectedVersion}
            >
              台帳へ登録
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}