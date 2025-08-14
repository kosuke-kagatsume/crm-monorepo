'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CustomerInfo {
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
}

interface CustomerInfoFormProps {
  data: CustomerInfo
  onChange: (field: keyof CustomerInfo, value: string) => void
  disabled?: boolean
}

export function CustomerInfoForm({ data, onChange, disabled }: CustomerInfoFormProps) {
  return (
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
              value={data.customerName}
              onChange={(e) => onChange('customerName', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={data.customerEmail}
              onChange={(e) => onChange('customerEmail', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              電話番号
            </label>
            <input
              type="tel"
              value={data.customerPhone}
              onChange={(e) => onChange('customerPhone', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              住所
            </label>
            <input
              type="text"
              value={data.customerAddress}
              onChange={(e) => onChange('customerAddress', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}