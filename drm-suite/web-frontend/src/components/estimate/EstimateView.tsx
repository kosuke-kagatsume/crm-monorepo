'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Estimate, EstimateVersion } from '@/types/estimate-v2'

interface EstimateViewProps {
  estimate: Estimate
  onEdit?: () => void
  onApprove?: () => void
  onExportPDF?: () => void
  onCreateContract?: () => void
}

export function EstimateView({ 
  estimate, 
  onEdit, 
  onApprove, 
  onExportPDF,
  onCreateContract 
}: EstimateViewProps) {
  const currentVersion = estimate.versions.find(
    v => v.id === estimate.selectedVersionId
  ) || estimate.versions[0]

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

  const totals = calculateTotals(currentVersion)

  const getApprovalStatusBadge = () => {
    if (!estimate.approval) return null
    
    switch (estimate.approval.status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">承認済み</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">承認待ち</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">却下</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">下書き</Badge>
    }
  }

  const getContractStatusBadge = () => {
    if (!estimate.contract) return null
    
    switch (estimate.contract.status) {
      case 'signed':
        return <Badge className="bg-green-100 text-green-800">契約締結済み</Badge>
      case 'sent':
        return <Badge className="bg-blue-100 text-blue-800">送信済み</Badge>
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">下書き</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{estimate.title}</h2>
          <div className="flex gap-2 mt-2">
            {getApprovalStatusBadge()}
            {getContractStatusBadge()}
          </div>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button onClick={onEdit} variant="outline">
              編集
            </Button>
          )}
          {onApprove && estimate.approval?.status === 'pending' && (
            <Button onClick={onApprove} variant="outline">
              承認
            </Button>
          )}
          {onExportPDF && (
            <Button onClick={onExportPDF} variant="outline">
              PDF出力
            </Button>
          )}
          {onCreateContract && estimate.approval?.status === 'approved' && !estimate.contract && (
            <Button onClick={onCreateContract}>
              契約書作成
            </Button>
          )}
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">顧客ID</span>
              <p className="font-medium">{estimate.customerId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">店舗ID</span>
              <p className="font-medium">{estimate.storeId}</p>
            </div>
            {estimate.method && (
              <div>
                <span className="text-sm text-gray-600">工法</span>
                <p className="font-medium">{estimate.method}</p>
              </div>
            )}
            {estimate.structure && (
              <div>
                <span className="text-sm text-gray-600">構造</span>
                <p className="font-medium">{estimate.structure}</p>
              </div>
            )}
            {estimate.category && (
              <div>
                <span className="text-sm text-gray-600">物件種別</span>
                <p className="font-medium">{estimate.category}</p>
              </div>
            )}
            <div>
              <span className="text-sm text-gray-600">作成日</span>
              <p className="font-medium">{new Date(estimate.createdAt).toLocaleDateString('ja-JP')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* バージョン選択 */}
      {estimate.versions.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>バージョン</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              {estimate.versions.map(version => (
                <div
                  key={version.id}
                  className={`px-3 py-1 rounded border ${
                    version.id === estimate.selectedVersionId
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-gray-50 border-gray-300'
                  }`}
                >
                  {version.label}
                  <span className="ml-2 text-xs opacity-70">
                    ({new Date(version.createdAt).toLocaleDateString('ja-JP')})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 見積明細 */}
      <Card>
        <CardHeader>
          <CardTitle>見積明細 - {currentVersion.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">品名</th>
                  <th className="text-center py-2 px-2">数量</th>
                  <th className="text-center py-2 px-2">単位</th>
                  <th className="text-right py-2 px-2">売価</th>
                  <th className="text-right py-2 px-2">金額</th>
                </tr>
              </thead>
              <tbody>
                {currentVersion.items.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2 px-2">{item.name}</td>
                    <td className="py-2 px-2 text-center">{item.qty}</td>
                    <td className="py-2 px-2 text-center">{item.unit}</td>
                    <td className="py-2 px-2 text-right">¥{item.price.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right font-medium">
                      ¥{(item.qty * item.price).toLocaleString()}
                    </td>
                  </tr>
                ))}
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
        </CardContent>
      </Card>

      {/* 支払い条件 */}
      {estimate.paymentPlan && (
        <Card>
          <CardHeader>
            <CardTitle>支払い条件</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {estimate.paymentPlan.depositPct && (
                <div>
                  <span className="text-sm text-gray-600">着工金</span>
                  <p className="font-medium">{estimate.paymentPlan.depositPct}%</p>
                </div>
              )}
              {estimate.paymentPlan.middlePct && (
                <div>
                  <span className="text-sm text-gray-600">中間金</span>
                  <p className="font-medium">{estimate.paymentPlan.middlePct}%</p>
                </div>
              )}
              {estimate.paymentPlan.finalPct && (
                <div>
                  <span className="text-sm text-gray-600">最終金</span>
                  <p className="font-medium">{estimate.paymentPlan.finalPct}%</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 承認履歴 */}
      {estimate.approval && estimate.approval.status !== 'draft' && (
        <Card>
          <CardHeader>
            <CardTitle>承認履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {estimate.approval.steps.map((step, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{step.role}</span>
                    <span className="ml-2 text-sm text-gray-600">
                      (承認閾値: ¥{step.threshold.toLocaleString()})
                    </span>
                  </div>
                  <Badge variant="outline">承認待ち</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}