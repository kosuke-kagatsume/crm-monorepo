'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EstimateItem, EstimateVersion, Estimate } from '@/types/estimate-v2'

interface EstimateEditorProps {
  estimate?: Estimate
  onSave: (estimate: Estimate) => Promise<void>
  onCancel?: () => void
}

export function EstimateEditor({ estimate, onSave, onCancel }: EstimateEditorProps) {
  const [currentEstimate, setCurrentEstimate] = useState<Estimate>(
    estimate || {
      id: '',
      customerId: '',
      title: '',
      storeId: '',
      versions: [{
        id: '1',
        label: 'v1',
        createdAt: new Date().toISOString(),
        items: []
      }],
      selectedVersionId: '1',
      createdBy: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  )

  const currentVersion = currentEstimate.versions.find(
    v => v.id === currentEstimate.selectedVersionId
  ) || currentEstimate.versions[0]

  const addItem = useCallback(() => {
    const newItem: EstimateItem = {
      id: Date.now().toString(),
      name: '',
      qty: 1,
      unit: '式',
      price: 0,
      cost: 0
    }

    setCurrentEstimate(prev => ({
      ...prev,
      versions: prev.versions.map(v =>
        v.id === currentVersion.id
          ? { ...v, items: [...v.items, newItem] }
          : v
      ),
      updatedAt: new Date().toISOString()
    }))
  }, [currentVersion])

  const updateItem = useCallback((itemId: string, field: keyof EstimateItem, value: any) => {
    setCurrentEstimate(prev => ({
      ...prev,
      versions: prev.versions.map(v =>
        v.id === currentVersion.id
          ? {
              ...v,
              items: v.items.map(item =>
                item.id === itemId ? { ...item, [field]: value } : item
              )
            }
          : v
      ),
      updatedAt: new Date().toISOString()
    }))
  }, [currentVersion])

  const removeItem = useCallback((itemId: string) => {
    setCurrentEstimate(prev => ({
      ...prev,
      versions: prev.versions.map(v =>
        v.id === currentVersion.id
          ? { ...v, items: v.items.filter(item => item.id !== itemId) }
          : v
      ),
      updatedAt: new Date().toISOString()
    }))
  }, [currentVersion])

  const addVersion = useCallback(() => {
    const newVersion: EstimateVersion = {
      id: Date.now().toString(),
      label: `v${currentEstimate.versions.length + 1}`,
      createdAt: new Date().toISOString(),
      items: [...currentVersion.items] // 現在のバージョンをコピー
    }

    setCurrentEstimate(prev => ({
      ...prev,
      versions: [...prev.versions, newVersion],
      selectedVersionId: newVersion.id,
      updatedAt: new Date().toISOString()
    }))
  }, [currentEstimate.versions, currentVersion])

  const selectVersion = useCallback((versionId: string) => {
    setCurrentEstimate(prev => ({
      ...prev,
      selectedVersionId: versionId
    }))
  }, [])

  const calculateTotals = () => {
    const items = currentVersion.items
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

  const totals = calculateTotals()

  const handleSave = async () => {
    await onSave(currentEstimate)
  }

  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">見積名</label>
              <Input
                value={currentEstimate.title}
                onChange={(e) => setCurrentEstimate(prev => ({ ...prev, title: e.target.value }))}
                placeholder="〇〇様邸 外壁塗装工事"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">工法</label>
              <Input
                value={currentEstimate.method || ''}
                onChange={(e) => setCurrentEstimate(prev => ({ ...prev, method: e.target.value }))}
                placeholder="シリコン塗装"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">構造</label>
              <Input
                value={currentEstimate.structure || ''}
                onChange={(e) => setCurrentEstimate(prev => ({ ...prev, structure: e.target.value }))}
                placeholder="木造2階建て"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">物件種別</label>
              <Input
                value={currentEstimate.category || ''}
                onChange={(e) => setCurrentEstimate(prev => ({ ...prev, category: e.target.value }))}
                placeholder="戸建住宅"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* バージョン管理 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>バージョン管理</CardTitle>
            <Button onClick={addVersion} size="sm" variant="outline">
              新規バージョン作成
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {currentEstimate.versions.map(version => (
              <Button
                key={version.id}
                onClick={() => selectVersion(version.id)}
                variant={version.id === currentEstimate.selectedVersionId ? 'default' : 'outline'}
                size="sm"
              >
                {version.label}
                <span className="ml-2 text-xs opacity-70">
                  ({new Date(version.createdAt).toLocaleDateString('ja-JP')})
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 見積明細 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>見積明細 - {currentVersion.label}</CardTitle>
            <Button onClick={addItem} size="sm">
              + 項目追加
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">品名</th>
                  <th className="text-center py-2 px-2 w-20">数量</th>
                  <th className="text-center py-2 px-2 w-20">単位</th>
                  <th className="text-right py-2 px-2 w-28">売価</th>
                  <th className="text-right py-2 px-2 w-28">原価</th>
                  <th className="text-right py-2 px-2 w-28">金額</th>
                  <th className="text-right py-2 px-2 w-20">粗利率</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {currentVersion.items.map(item => {
                  const amount = item.qty * item.price
                  const cost = item.qty * (item.cost || 0)
                  const profit = amount - cost
                  const profitRate = amount > 0 ? (profit / amount * 100) : 0
                  
                  return (
                    <tr key={item.id} className="border-b">
                      <td className="py-2 px-2">
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          placeholder="品名"
                          className="w-full"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                          className="text-center"
                          min="0"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                          className="w-full px-2 py-1 border rounded"
                        >
                          <option>式</option>
                          <option>個</option>
                          <option>㎡</option>
                          <option>m</option>
                          <option>台</option>
                          <option>人日</option>
                        </select>
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                          className="text-right"
                          min="0"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <Input
                          type="number"
                          value={item.cost || 0}
                          onChange={(e) => updateItem(item.id, 'cost', Number(e.target.value))}
                          className="text-right"
                          min="0"
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        ¥{amount.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 text-right">
                        <span className={profitRate >= 30 ? 'text-green-600' : profitRate >= 20 ? 'text-yellow-600' : 'text-red-600'}>
                          {profitRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <Button
                          onClick={() => removeItem(item.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 合計 */}
      <Card>
        <CardHeader>
          <CardTitle>合計</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>小計</span>
                <span className="font-medium">¥{totals.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>消費税（10%）</span>
                <span className="font-medium">¥{Math.floor(totals.tax).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>合計</span>
                <span className="text-blue-600">¥{Math.floor(totals.total).toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>原価合計</span>
                <span className="font-medium">¥{totals.costTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>粗利益</span>
                <span className="font-medium">¥{totals.profit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>粗利率</span>
                <span className={totals.profitRate >= 30 ? 'text-green-600' : totals.profitRate >= 20 ? 'text-yellow-600' : 'text-red-600'}>
                  {totals.profitRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* アクションボタン */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button onClick={onCancel} variant="outline">
            キャンセル
          </Button>
        )}
        <Button onClick={handleSave}>
          保存
        </Button>
      </div>
    </div>
  )
}