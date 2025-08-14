'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EstimateSection } from './types'

interface TemplateItem {
  name: string
  sections: EstimateSection[]
}

interface EstimateTemplatePanelProps {
  onSelectTemplate: (template: TemplateItem) => void
  disabled?: boolean
}

export function EstimateTemplatePanel({ onSelectTemplate, disabled }: EstimateTemplatePanelProps) {
  const templates: TemplateItem[] = [
    {
      name: '外壁塗装工事',
      sections: [{
        id: '1',
        title: '外壁塗装工事',
        items: [
          {
            id: '1',
            description: '外壁洗浄・下地処理',
            quantity: 1,
            unitPrice: 50000,
            unit: '式',
            amount: 50000
          },
          {
            id: '2',
            description: '外壁塗装（下塗り・中塗り・上塗り）',
            quantity: 100,
            unitPrice: 2500,
            unit: '㎡',
            amount: 250000
          }
        ],
        subtotal: 300000
      }]
    },
    {
      name: '屋根修理工事',
      sections: [{
        id: '1',
        title: '屋根修理工事',
        items: [
          {
            id: '1',
            description: '屋根材撤去・処分',
            quantity: 1,
            unitPrice: 80000,
            unit: '式',
            amount: 80000
          },
          {
            id: '2',
            description: '新規屋根材設置',
            quantity: 50,
            unitPrice: 4000,
            unit: '㎡',
            amount: 200000
          }
        ],
        subtotal: 280000
      }]
    },
    {
      name: 'リフォーム工事',
      sections: [{
        id: '1',
        title: 'リフォーム工事',
        items: [
          {
            id: '1',
            description: '解体工事',
            quantity: 1,
            unitPrice: 150000,
            unit: '式',
            amount: 150000
          },
          {
            id: '2',
            description: '内装工事',
            quantity: 20,
            unitPrice: 15000,
            unit: '㎡',
            amount: 300000
          }
        ],
        subtotal: 450000
      }]
    },
    {
      name: '新築工事',
      sections: [{
        id: '1',
        title: '新築工事',
        items: [
          {
            id: '1',
            description: '基礎工事',
            quantity: 1,
            unitPrice: 1200000,
            unit: '式',
            amount: 1200000
          },
          {
            id: '2',
            description: '躯体工事',
            quantity: 1,
            unitPrice: 2500000,
            unit: '式',
            amount: 2500000
          }
        ],
        subtotal: 3700000
      }]
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>テンプレート</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {templates.map((template) => (
          <button
            key={template.name}
            onClick={() => onSelectTemplate(template)}
            disabled={disabled}
            className="w-full text-left px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {template.name}
          </button>
        ))}
      </CardContent>
    </Card>
  )
}