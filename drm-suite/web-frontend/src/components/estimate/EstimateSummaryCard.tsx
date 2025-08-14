'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EstimateSummaryProps {
  subtotal: number
  tax: number
  total: number
}

export function EstimateSummaryCard({ subtotal, tax, total }: EstimateSummaryProps) {
  return (
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
  )
}