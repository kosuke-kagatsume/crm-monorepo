/**
 * Estimate Management Custom Hook
 * 見積データの取得・作成・更新・削除・承認フローを管理
 */
import { useState, useEffect } from 'react';
import { Estimate, EstimateFilter, EstimateStats } from '@/types/estimate';
import { estimateService } from '@/services/estimate.service';

/**
 * useEstimatesフックのオプション
 */
export interface UseEstimatesOptions {
  filter?: EstimateFilter;
  autoFetch?: boolean;
}

/**
 * useEstimatesフックの戻り値
 */
export interface UseEstimatesReturn {
  estimates: Estimate[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;

  // Actions
  fetchEstimates: (filter?: EstimateFilter) => Promise<void>;
  createEstimate: (estimate: any) => Promise<Estimate>;
  updateEstimate: (id: string, data: any) => Promise<Estimate>;
  deleteEstimate: (id: string) => Promise<void>;
  refreshEstimates: () => Promise<void>;

  // Workflow actions
  submitForApproval: (id: string) => Promise<Estimate>;
  approveEstimate: (id: string, comments?: string) => Promise<Estimate>;
  rejectEstimate: (id: string, reason: string) => Promise<Estimate>;

  // PDF generation
  generatePDF: (id: string) => Promise<Blob>;

  // Filters
  setFilter: (filter: EstimateFilter) => void;
  clearFilter: () => void;
}

export const useEstimates = (
  options: UseEstimatesOptions = {},
): UseEstimatesReturn => {
  const { filter: initialFilter, autoFetch = true } = options;

  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<EstimateFilter>(
    initialFilter || {},
  );

  const fetchEstimates = async (filter?: EstimateFilter) => {
    const filterToUse = filter || currentFilter;

    try {
      setLoading(true);
      setError(null);

      const result = await estimateService.getEstimates(filterToUse);

      setEstimates(result.estimates);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch estimates',
      );
      console.error('Error fetching estimates:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEstimate = async (estimateData: any): Promise<Estimate> => {
    try {
      setError(null);
      const newEstimate = await estimateService.createEstimate(estimateData);

      // Add to local state
      setEstimates((prev) => [newEstimate, ...prev]);
      setTotal((prev) => prev + 1);

      return newEstimate;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create estimate';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateEstimate = async (id: string, data: any): Promise<Estimate> => {
    try {
      setError(null);
      const updatedEstimate = await estimateService.updateEstimate({
        id,
        ...data,
      });

      // Update local state
      setEstimates((prev) =>
        prev.map((estimate) =>
          estimate.id === id ? updatedEstimate : estimate,
        ),
      );

      return updatedEstimate;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update estimate';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteEstimate = async (id: string): Promise<void> => {
    try {
      setError(null);
      await estimateService.deleteEstimate(id);

      // Remove from local state
      setEstimates((prev) => prev.filter((estimate) => estimate.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete estimate';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const submitForApproval = async (id: string): Promise<Estimate> => {
    try {
      setError(null);
      const updatedEstimate = await estimateService.submitForApproval(id);

      // Update local state
      setEstimates((prev) =>
        prev.map((estimate) =>
          estimate.id === id ? updatedEstimate : estimate,
        ),
      );

      return updatedEstimate;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to submit for approval';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const approveEstimate = async (
    id: string,
    comments?: string,
  ): Promise<Estimate> => {
    try {
      setError(null);
      const updatedEstimate = await estimateService.approveEstimate(
        id,
        comments,
      );

      // Update local state
      setEstimates((prev) =>
        prev.map((estimate) =>
          estimate.id === id ? updatedEstimate : estimate,
        ),
      );

      return updatedEstimate;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to approve estimate';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const rejectEstimate = async (
    id: string,
    reason: string,
  ): Promise<Estimate> => {
    try {
      setError(null);
      const updatedEstimate = await estimateService.rejectEstimate(id, reason);

      // Update local state
      setEstimates((prev) =>
        prev.map((estimate) =>
          estimate.id === id ? updatedEstimate : estimate,
        ),
      );

      return updatedEstimate;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to reject estimate';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const generatePDF = async (id: string): Promise<Blob> => {
    try {
      setError(null);
      return await estimateService.generatePDF(id);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshEstimates = async () => {
    await fetchEstimates(currentFilter);
  };

  const setFilter = (filter: EstimateFilter) => {
    setCurrentFilter(filter);
    fetchEstimates(filter);
  };

  const clearFilter = () => {
    const emptyFilter = {};
    setCurrentFilter(emptyFilter);
    fetchEstimates(emptyFilter);
  };

  // Auto fetch on mount and filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchEstimates(currentFilter);
    }
  }, [autoFetch]); // Only run on mount or autoFetch change

  return {
    estimates,
    loading,
    error,
    total,
    hasMore,

    fetchEstimates,
    createEstimate,
    updateEstimate,
    deleteEstimate,
    refreshEstimates,

    submitForApproval,
    approveEstimate,
    rejectEstimate,
    generatePDF,

    setFilter,
    clearFilter,
  };
};

// Hook for estimate statistics
export const useEstimateStats = (period?: string) => {
  const [stats, setStats] = useState<EstimateStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await estimateService.getEstimateStats(period);
      setStats(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      console.error('Error fetching estimate stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats,
  };
};

// Hook for single estimate
export const useEstimate = (id: string) => {
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstimate = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const result = await estimateService.getEstimate(id);
      setEstimate(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch estimate');
      console.error('Error fetching estimate:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstimate();
  }, [id]);

  return {
    estimate,
    loading,
    error,
    refreshEstimate: fetchEstimate,
  };
};

// Hook for RAG AI suggestions
export const useRAGSuggestions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findSimilarEstimates = async (query: string, limit: number = 5) => {
    try {
      setLoading(true);
      setError(null);
      return await estimateService.findSimilarEstimates(query, limit);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to find similar estimates';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const suggestItems = async (projectType: string, description: string) => {
    try {
      setLoading(true);
      setError(null);
      return await estimateService.suggestItems(projectType, description);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to suggest items';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const optimizePricing = async (sections: any[]) => {
    try {
      setLoading(true);
      setError(null);
      return await estimateService.optimizePricing(sections);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to optimize pricing';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    findSimilarEstimates,
    suggestItems,
    optimizePricing,
  };
};
