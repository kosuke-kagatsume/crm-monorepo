'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EstimateItem, EstimateSection } from './types'

interface EstimateFormProps {
  initialSections?: EstimateSection[]
  onSectionsChange: (sections: EstimateSection[]) => void
  disabled?: boolean
}

export function EstimateForm({ initialSections, onSectionsChange, disabled }: EstimateFormProps) {
  const [sections, setSections] = useState<EstimateSection[]>(
    initialSections || [{
      id: '1',
      title: '基本工事',
      items: [],
      subtotal: 0
    }]
  )

  useEffect(() => {
    onSectionsChange(sections)
  }, [sections, onSectionsChange])

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

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <input
                type="text"
                value={section.title}
                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                className="text-lg font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                disabled={disabled}
              />
              {sections.length > 1 && !disabled && (
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
                    {!disabled && <th className="w-10"></th>}
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
                          disabled={disabled}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(section.id, item.id, 'quantity', Number(e.target.value))}
                          className="w-full px-2 py-1 border rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="0"
                          disabled={disabled}
                        />
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(section.id, item.id, 'unit', e.target.value)}
                          className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          disabled={disabled}
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
                          disabled={disabled}
                        />
                      </td>
                      <td className="py-2 px-2 text-right font-medium">
                        ¥{item.amount.toLocaleString()}
                      </td>
                      {!disabled && (
                        <td className="py-2 px-2">
                          <button
                            onClick={() => removeItem(section.id, item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {!disabled && (
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
                  )}
                  <tr>
                    <td colSpan={4} className="text-right py-2 font-medium">
                      小計：
                    </td>
                    <td className="text-right py-2 font-medium">
                      ¥{section.subtotal.toLocaleString()}
                    </td>
                    {!disabled && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {!disabled && (
        <button
          onClick={addSection}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600"
        >
          + セクション追加
        </button>
      )}
    </div>
  )
}