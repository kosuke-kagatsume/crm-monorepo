'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ProjectInfo {
  title: string
  description: string
  validUntil: string
  deliveryDate: string
  paymentTerms: string
}

interface ProjectInfoFormProps {
  data: ProjectInfo
  onChange: (field: keyof ProjectInfo, value: string) => void
  disabled?: boolean
}

export function ProjectInfoForm({ data, onChange, disabled }: ProjectInfoFormProps) {
  return (
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
            value={data.title}
            onChange={(e) => onChange('title', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={disabled}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            説明
          </label>
          <textarea
            value={data.description}
            onChange={(e) => onChange('description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={disabled}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              有効期限
            </label>
            <input
              type="date"
              value={data.validUntil}
              onChange={(e) => onChange('validUntil', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              納期
            </label>
            <input
              type="date"
              value={data.deliveryDate}
              onChange={(e) => onChange('deliveryDate', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支払条件
            </label>
            <select
              value={data.paymentTerms}
              onChange={(e) => onChange('paymentTerms', e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={disabled}
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
  )
}