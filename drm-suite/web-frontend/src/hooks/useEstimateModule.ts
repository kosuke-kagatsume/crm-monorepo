'use client'

import { useState, useCallback } from 'react'
import { EstimateData, EstimateSection, EstimateFilters } from '@/components/estimate/types'

export function useEstimateModule() {
  const [estimates, setEstimates] = useState<EstimateData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 見積一覧の取得
  const fetchEstimates = useCallback(async (filters?: Partial<EstimateFilters>) => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      if (filters?.filterStatus) params.append('status', filters.filterStatus)
      if (filters?.searchTerm) params.append('search', filters.searchTerm)
      
      const response = await fetch(`/api/estimates?${params}`)
      if (!response.ok) throw new Error('Failed to fetch estimates')
      
      const data = await response.json()
      setEstimates(data.estimates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  // 見積の作成
  const createEstimate = useCallback(async (estimateData: Omit<EstimateData, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estimateData)
      })
      
      if (!response.ok) throw new Error('Failed to create estimate')
      
      const data = await response.json()
      setEstimates(prev => [data.estimate, ...prev])
      return data.estimate
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 見積の更新
  const updateEstimate = useCallback(async (id: string, updates: Partial<EstimateData>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/estimates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!response.ok) throw new Error('Failed to update estimate')
      
      const data = await response.json()
      setEstimates(prev => prev.map(est => est.id === id ? data.estimate : est))
      return data.estimate
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 見積の削除
  const deleteEstimate = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/estimates/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete estimate')
      
      setEstimates(prev => prev.filter(est => est.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 承認申請
  const submitForApproval = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/estimates/${id}/submit`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to submit for approval')
      
      const data = await response.json()
      setEstimates(prev => prev.map(est => est.id === id ? data.estimate : est))
      return data.estimate
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 承認
  const approveEstimate = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/estimates/${id}/approve`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to approve estimate')
      
      const data = await response.json()
      setEstimates(prev => prev.map(est => est.id === id ? data.estimate : est))
      return data.estimate
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // PDF生成
  const generatePDF = useCallback(async (id: string): Promise<Blob> => {
    const response = await fetch(`/api/estimates/${id}/pdf`)
    
    if (!response.ok) throw new Error('Failed to generate PDF')
    
    return response.blob()
  }, [])

  // AI提案
  const suggestItems = useCallback(async (title: string, description: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/estimates/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
      })
      
      if (!response.ok) throw new Error('Failed to get AI suggestions')
      
      const data = await response.json()
      return data.suggestions
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 価格最適化
  const optimizePricing = useCallback(async (sections: EstimateSection[]) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/estimates/ai/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections })
      })
      
      if (!response.ok) throw new Error('Failed to optimize pricing')
      
      const data = await response.json()
      return data.sections
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    estimates,
    loading,
    error,
    fetchEstimates,
    createEstimate,
    updateEstimate,
    deleteEstimate,
    submitForApproval,
    approveEstimate,
    generatePDF,
    suggestItems,
    optimizePricing
  }
}