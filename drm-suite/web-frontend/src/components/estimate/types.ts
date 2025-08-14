export interface EstimateItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  unit: string
  amount: number
  notes?: string
}

export interface EstimateSection {
  id: string
  title: string
  items: EstimateItem[]
  subtotal: number
}

export interface EstimateData {
  id?: string
  estimateNo: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  title: string
  description: string
  sections: EstimateSection[]
  subtotal: number
  tax: number
  totalAmount: number
  validUntil: string
  paymentTerms: string
  deliveryDate: string
  notes: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'sent'
  createdAt?: string
  updatedAt?: string
}

export interface EstimateFilters {
  searchTerm: string
  filterStatus: string
  sortBy: string
}

export interface EstimateSummary {
  totalCount: number
  pendingCount: number
  totalAmount: number
  conversionRate: number
}