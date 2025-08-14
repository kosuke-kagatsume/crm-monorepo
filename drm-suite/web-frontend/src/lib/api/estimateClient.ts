import { Estimate, EstimateItem, EstimateVersion } from '@/types/estimate-v2'

const API_BASE = '/api/estimates'

export const estimateClient = {
  // 見積一覧取得
  async list(filters?: {
    status?: string
    customerId?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ estimates: Estimate[]; total: number }> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, value.toString())
      })
    }
    
    const response = await fetch(`${API_BASE}?${params}`)
    if (!response.ok) throw new Error('Failed to fetch estimates')
    return response.json()
  },

  // 見積詳細取得
  async get(id: string): Promise<Estimate> {
    const response = await fetch(`${API_BASE}/${id}`)
    if (!response.ok) throw new Error('Failed to fetch estimate')
    return response.json()
  },

  // 見積作成
  async create(estimate: Omit<Estimate, 'id' | 'createdAt' | 'updatedAt'>): Promise<Estimate> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(estimate)
    })
    if (!response.ok) throw new Error('Failed to create estimate')
    return response.json()
  },

  // 見積更新
  async update(id: string, updates: Partial<Estimate>): Promise<Estimate> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    if (!response.ok) throw new Error('Failed to update estimate')
    return response.json()
  },

  // 見積削除
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete estimate')
  },

  // バージョン追加
  async addVersion(estimateId: string, version: EstimateVersion): Promise<Estimate> {
    const response = await fetch(`${API_BASE}/${estimateId}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(version)
    })
    if (!response.ok) throw new Error('Failed to add version')
    return response.json()
  },

  // 承認申請
  async submitForApproval(id: string): Promise<Estimate> {
    const response = await fetch(`${API_BASE}/${id}/submit`, {
      method: 'POST'
    })
    if (!response.ok) throw new Error('Failed to submit for approval')
    return response.json()
  },

  // 承認
  async approve(id: string, comments?: string): Promise<Estimate> {
    const response = await fetch(`${API_BASE}/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments })
    })
    if (!response.ok) throw new Error('Failed to approve estimate')
    return response.json()
  },

  // 却下
  async reject(id: string, reason: string): Promise<Estimate> {
    const response = await fetch(`${API_BASE}/${id}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    })
    if (!response.ok) throw new Error('Failed to reject estimate')
    return response.json()
  },

  // PDF生成
  async generatePDF(id: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/${id}/pdf`)
    if (!response.ok) throw new Error('Failed to generate PDF')
    return response.blob()
  },

  // 契約書作成
  async createContract(id: string, provider: 'gmo' | 'cloudsign'): Promise<{ url: string }> {
    const response = await fetch(`${API_BASE}/${id}/contract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider })
    })
    if (!response.ok) throw new Error('Failed to create contract')
    return response.json()
  },

  // テンプレートから見積作成
  async createFromTemplate(templateId: string, customerId: string): Promise<Estimate> {
    const response = await fetch(`${API_BASE}/from-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId, customerId })
    })
    if (!response.ok) throw new Error('Failed to create from template')
    return response.json()
  },

  // AI推奨取得
  async getAISuggestions(estimateId: string): Promise<{
    items: EstimateItem[]
    vendors: Array<{ id: string; name: string; score: number }>
    insights: string[]
  }> {
    const response = await fetch(`${API_BASE}/${estimateId}/ai/suggestions`)
    if (!response.ok) throw new Error('Failed to get AI suggestions')
    return response.json()
  },

  // 在庫チェック
  async checkInventory(items: EstimateItem[]): Promise<{
    available: boolean
    shortages: Array<{ itemId: string; required: number; available: number }>
  }> {
    const response = await fetch(`${API_BASE}/inventory/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    })
    if (!response.ok) throw new Error('Failed to check inventory')
    return response.json()
  },

  // 仕入先推奨
  async getVendorRecommendations(items: EstimateItem[]): Promise<Array<{
    vendorId: string
    vendorName: string
    totalCost: number
    deliveryDays: number
    reliability: number
  }>> {
    const response = await fetch(`${API_BASE}/vendors/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    })
    if (!response.ok) throw new Error('Failed to get vendor recommendations')
    return response.json()
  }
}