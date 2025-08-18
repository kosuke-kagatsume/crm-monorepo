/**
 * Customer Management Custom Hook
 * 顧客データの取得・作成・更新・削除を管理
 */
import { useState, useEffect } from 'react';
import { Customer, CustomerFilter, CustomerStats } from '@/types/customer';
import { customerService } from '@/services/customer.service';

/**
 * useCustomersフックのオプション
 */
export interface UseCustomersOptions {
  filter?: CustomerFilter;
  autoFetch?: boolean;
}

/**
 * useCustomersフックの戻り値
 */
export interface UseCustomersReturn {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;

  // Actions
  fetchCustomers: (filter?: CustomerFilter) => Promise<void>;
  createCustomer: (customer: any) => Promise<Customer>;
  updateCustomer: (id: string, data: any) => Promise<Customer>;
  deleteCustomer: (id: string) => Promise<void>;
  refreshCustomers: () => Promise<void>;

  // Filters
  setFilter: (filter: CustomerFilter) => void;
  clearFilter: () => void;
}

/**
 * 顧客管理用カスタムフック
 * @param {UseCustomersOptions} options - フックのオプション
 * @returns {UseCustomersReturn} 顧客データと操作関数
 */
export const useCustomers = (
  options: UseCustomersOptions = {},
): UseCustomersReturn => {
  const { filter: initialFilter, autoFetch = true } = options;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<CustomerFilter>(
    initialFilter || {},
  );

  const fetchCustomers = async (filter?: CustomerFilter) => {
    const filterToUse = filter || currentFilter;

    try {
      setLoading(true);
      setError(null);

      const result = await customerService.getCustomers(filterToUse);

      setCustomers(result.customers);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch customers',
      );
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: any): Promise<Customer> => {
    try {
      setError(null);
      const newCustomer = await customerService.createCustomer(customerData);

      // Add to local state
      setCustomers((prev) => [newCustomer, ...prev]);
      setTotal((prev) => prev + 1);

      return newCustomer;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to create customer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateCustomer = async (id: string, data: any): Promise<Customer> => {
    try {
      setError(null);
      const updatedCustomer = await customerService.updateCustomer({
        id,
        ...data,
      });

      // Update local state
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id ? updatedCustomer : customer,
        ),
      );

      return updatedCustomer;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update customer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const deleteCustomer = async (id: string): Promise<void> => {
    try {
      setError(null);
      await customerService.deleteCustomer(id);

      // Remove from local state
      setCustomers((prev) => prev.filter((customer) => customer.id !== id));
      setTotal((prev) => prev - 1);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete customer';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const refreshCustomers = async () => {
    await fetchCustomers(currentFilter);
  };

  const setFilter = (filter: CustomerFilter) => {
    setCurrentFilter(filter);
    fetchCustomers(filter);
  };

  const clearFilter = () => {
    const emptyFilter = {};
    setCurrentFilter(emptyFilter);
    fetchCustomers(emptyFilter);
  };

  // Auto fetch on mount and filter changes
  useEffect(() => {
    if (autoFetch) {
      fetchCustomers(currentFilter);
    }
  }, [autoFetch]); // Only run on mount or autoFetch change

  return {
    customers,
    loading,
    error,
    total,
    hasMore,

    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    refreshCustomers,

    setFilter,
    clearFilter,
  };
};

// Hook for customer statistics
export const useCustomerStats = () => {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await customerService.getCustomerStats();
      setStats(result as CustomerStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      console.error('Error fetching customer stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refreshStats: fetchStats,
  };
};

// Hook for single customer
export const useCustomer = (id: string) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const result = await customerService.getCustomer(id);
      setCustomer(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customer');
      console.error('Error fetching customer:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  return {
    customer,
    loading,
    error,
    refreshCustomer: fetchCustomer,
  };
};
