'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EstimateItem } from '@/types/estimate-v2'

interface Template {
  id: string
  name: string
  description: string
  category: string
  storeId?: string
  assignee?: string
  method?: string
  structure?: string
  reformArea?: string
  items: Array<EstimateItem>
  totalAmount: number
  createdAt: string
  usageCount?: number
}

interface CopyFromTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (template: Template, options: CopyOptions) => void
}

interface CopyOptions {
  copyAll: boolean
  selectedItems?: string[]
  includeChildren?: boolean
  includeAttachments?: boolean
}

export function CopyFromTemplateDialog({ isOpen, onClose, onSelect }: CopyFromTemplateDialogProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [copyOptions, setCopyOptions] = useState<CopyOptions>({
    copyAll: true,
    includeChildren: true,
    includeAttachments: true
  })
  
  // フィルター
  const [filters, setFilters] = useState({
    search: '',
    storeId: 'all',
    assignee: 'all',
    category: 'all',
    amountRange: 'all',
    method: 'all',
    structure: 'all',
    reformArea: 'all'
  })

  useEffect(() => {
    if (isOpen) {
      fetchTemplates()
    }
  }, [isOpen])

  useEffect(() => {
    applyFilters()
  }, [templates, filters])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/estimates/templates')
      const data = await response.json()
      
      // ダミーデータを追加（実際には過去の見積から取得）
      const mockTemplates: Template[] = [
        ...data.templates,
        {
          id: 'EST-HIST-001',
          name: '山田様邸 外壁塗装工事（前回）',
          description: '2024年1月実施 - 好評価案件',
          category: '塗装',
          storeId: 'STORE-001',
          assignee: 'USER-001',
          method: 'シリコン塗装',
          structure: '木造2階建て',
          totalAmount: 1350000,
          createdAt: '2024-01-15T00:00:00Z',
          usageCount: 1,
          items: [
            { id: '1', name: '足場設置・撤去', qty: 1, unit: '式', price: 150000, cost: 100000, parentId: undefined },
            { id: '2', name: '高圧洗浄', qty: 100, unit: '㎡', price: 300, cost: 150, parentId: undefined },
            { id: '3', name: '下地処理', qty: 100, unit: '㎡', price: 500, cost: 300, parentId: undefined },
            { id: '4', name: '外壁塗装（シリコン）', qty: 100, unit: '㎡', price: 3500, cost: 2000, parentId: undefined },
            { id: '4-1', name: '下塗り', qty: 100, unit: '㎡', price: 1000, cost: 600, parentId: '4' },
            { id: '4-2', name: '中塗り', qty: 100, unit: '㎡', price: 1200, cost: 700, parentId: '4' },
            { id: '4-3', name: '上塗り', qty: 100, unit: '㎡', price: 1300, cost: 700, parentId: '4' },
            { id: '5', name: '付帯部塗装', qty: 1, unit: '式', price: 80000, cost: 50000, parentId: undefined, 
              attachments: [{ name: '施工写真.jpg', url: '/files/photo1.jpg' }] }
          ]
        }
      ]
      
      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const applyFilters = () => {
    let filtered = [...templates]
    
    // 検索フィルター
    if (filters.search) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.description.toLowerCase().includes(filters.search.toLowerCase())
      )
    }
    
    // 店舗フィルター
    if (filters.storeId !== 'all') {
      filtered = filtered.filter(t => t.storeId === filters.storeId)
    }
    
    // 担当者フィルター
    if (filters.assignee !== 'all') {
      filtered = filtered.filter(t => t.assignee === filters.assignee)
    }
    
    // カテゴリフィルター
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category)
    }
    
    // 工法フィルター
    if (filters.method !== 'all') {
      filtered = filtered.filter(t => t.method === filters.method)
    }
    
    // 構造フィルター
    if (filters.structure !== 'all') {
      filtered = filtered.filter(t => t.structure === filters.structure)
    }
    
    // リフォーム箇所フィルター
    if (filters.reformArea !== 'all' && filters.category === 'リフォーム') {
      filtered = filtered.filter(t => t.reformArea === filters.reformArea)
    }
    
    // 金額帯フィルター
    if (filters.amountRange !== 'all') {
      filtered = filtered.filter(t => {
        const amount = t.totalAmount
        switch (filters.amountRange) {
          case 'under1m':
            return amount < 1000000
          case '1m-5m':
            return amount >= 1000000 && amount < 5000000
          case '5m-10m':
            return amount >= 5000000 && amount < 10000000
          case 'over10m':
            return amount >= 10000000
          default:
            return true
        }
      })
    }
    
    setFilteredTemplates(filtered)
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    setSelectedItems(new Set())
    setCopyOptions({ ...copyOptions, copyAll: true })
  }

  const handleItemToggle = (itemId: string) => {
    const newSet = new Set(selectedItems)
    if (newSet.has(itemId)) {
      newSet.delete(itemId)
      // 親が外れたら子も外す
      if (selectedTemplate) {
        selectedTemplate.items
          .filter(item => item.parentId === itemId)
          .forEach(child => newSet.delete(child.id))
      }
    } else {
      newSet.add(itemId)
      // 子が選ばれたら親も選ぶ
      if (selectedTemplate) {
        const item = selectedTemplate.items.find(i => i.id === itemId)
        if (item?.parentId) {
          newSet.add(item.parentId)
        }
        // 親が選ばれたら子も選ぶ（オプション）
        if (copyOptions.includeChildren) {
          selectedTemplate.items
            .filter(child => child.parentId === itemId)
            .forEach(child => newSet.add(child.id))
        }
      }
    }
    setSelectedItems(newSet)
    setCopyOptions({ ...copyOptions, copyAll: false })
  }

  const handleCopy = () => {
    if (!selectedTemplate) return
    
    const options: CopyOptions = {
      ...copyOptions,
      selectedItems: copyOptions.copyAll ? undefined : Array.from(selectedItems)
    }
    
    onSelect(selectedTemplate, options)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">テンプレートから選択</h2>
            <Button onClick={onClose} variant="ghost" size="sm">
              ×
            </Button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-180px)]">
          {/* 左側：フィルターとテンプレート一覧 */}
          <div className="w-1/2 border-r overflow-y-auto">
            {/* フィルター */}
            <div className="p-4 border-b bg-gray-50">
              <div className="space-y-3">
                <Input
                  placeholder="テンプレート名で検索..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filters.storeId}
                    onChange={(e) => setFilters({...filters, storeId: e.target.value})}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="all">全店舗</option>
                    <option value="STORE-001">東京本店</option>
                    <option value="STORE-002">大阪支店</option>
                    <option value="STORE-003">名古屋支店</option>
                  </select>
                  
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({...filters, category: e.target.value})}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="all">全カテゴリ</option>
                    <option value="塗装">塗装</option>
                    <option value="屋根">屋根</option>
                    <option value="リフォーム">リフォーム</option>
                    <option value="新築">新築</option>
                  </select>
                  
                  <select
                    value={filters.amountRange}
                    onChange={(e) => setFilters({...filters, amountRange: e.target.value})}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="all">全金額帯</option>
                    <option value="under1m">100万円未満</option>
                    <option value="1m-5m">100-500万円</option>
                    <option value="5m-10m">500-1000万円</option>
                    <option value="over10m">1000万円以上</option>
                  </select>
                  
                  <select
                    value={filters.method}
                    onChange={(e) => setFilters({...filters, method: e.target.value})}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="all">全工法</option>
                    <option value="シリコン塗装">シリコン塗装</option>
                    <option value="フッ素塗装">フッ素塗装</option>
                    <option value="瓦交換">瓦交換</option>
                  </select>
                </div>
                
                {filters.category === 'リフォーム' && (
                  <select
                    value={filters.reformArea}
                    onChange={(e) => setFilters({...filters, reformArea: e.target.value})}
                    className="px-2 py-1 border rounded text-sm w-full"
                  >
                    <option value="all">全リフォーム箇所</option>
                    <option value="キッチン">キッチン</option>
                    <option value="バスルーム">バスルーム</option>
                    <option value="トイレ">トイレ</option>
                    <option value="外壁">外壁</option>
                    <option value="屋根">屋根</option>
                  </select>
                )}
              </div>
            </div>

            {/* テンプレート一覧 */}
            <div className="p-4 space-y-3">
              {filteredTemplates.map(template => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate?.id === template.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {template.items.length}項目
                      </span>
                      <span className="text-base font-bold text-blue-600">
                        ¥{template.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    {template.usageCount && (
                      <p className="text-xs text-gray-500 mt-1">
                        使用回数: {template.usageCount}回
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* 右側：詳細とコピーオプション */}
          <div className="w-1/2 p-4 overflow-y-auto">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">明細項目</h3>
                  <div className="border rounded-lg p-3">
                    {/* コピーオプション */}
                    <div className="flex items-center gap-4 mb-3 pb-3 border-b">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={copyOptions.copyAll}
                          onChange={() => setCopyOptions({...copyOptions, copyAll: true})}
                        />
                        <span className="text-sm">全コピー</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          checked={!copyOptions.copyAll}
                          onChange={() => setCopyOptions({...copyOptions, copyAll: false})}
                        />
                        <span className="text-sm">選択行のみコピー</span>
                      </label>
                    </div>
                    
                    {!copyOptions.copyAll && (
                      <div className="flex items-center gap-4 mb-3">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={copyOptions.includeChildren}
                            onChange={(e) => setCopyOptions({...copyOptions, includeChildren: e.target.checked})}
                          />
                          <span className="text-xs">親子関係を含む</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={copyOptions.includeAttachments}
                            onChange={(e) => setCopyOptions({...copyOptions, includeAttachments: e.target.checked})}
                          />
                          <span className="text-xs">添付ファイルを含む</span>
                        </label>
                      </div>
                    )}
                    
                    {/* 項目リスト */}
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                      {selectedTemplate.items.filter(item => !item.parentId).map(item => (
                        <div key={item.id}>
                          <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
                            {!copyOptions.copyAll && (
                              <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => handleItemToggle(item.id)}
                              />
                            )}
                            <span className="flex-1 text-sm">{item.name}</span>
                            <span className="text-sm text-gray-600">
                              {item.qty}{item.unit}
                            </span>
                            <span className="text-sm font-medium">
                              ¥{(item.qty * item.price).toLocaleString()}
                            </span>
                            {item.attachments && item.attachments.length > 0 && (
                              <Badge variant="outline" className="text-xs">📎</Badge>
                            )}
                          </label>
                          
                          {/* 子項目 */}
                          {selectedTemplate.items.filter(child => child.parentId === item.id).map(child => (
                            <label key={child.id} className="flex items-center gap-2 p-2 pl-8 hover:bg-gray-50 rounded">
                              {!copyOptions.copyAll && (
                                <input
                                  type="checkbox"
                                  checked={selectedItems.has(child.id)}
                                  onChange={() => handleItemToggle(child.id)}
                                />
                              )}
                              <span className="flex-1 text-sm text-gray-600">└ {child.name}</span>
                              <span className="text-sm text-gray-500">
                                {child.qty}{child.unit}
                              </span>
                              <span className="text-sm">
                                ¥{(child.qty * child.price).toLocaleString()}
                              </span>
                            </label>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-20">
                左側からテンプレートを選択してください
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t flex justify-between">
          <div className="text-sm text-gray-600">
            {selectedTemplate && !copyOptions.copyAll && (
              <span>選択中: {selectedItems.size}項目</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline">
              キャンセル
            </Button>
            <Button onClick={handleCopy} disabled={!selectedTemplate}>
              コピー
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}