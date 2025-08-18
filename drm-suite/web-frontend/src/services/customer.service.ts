/**
 * Customer Service - 顧客管理API
 */
import { Customer, CustomerStatus } from '@/types/customer';

const CUSTOMER_API_URL =
  process.env.NEXT_PUBLIC_CUSTOMER_API_URL || 'http://localhost:3001/api';

export interface CreateCustomerRequest {
  name: string;
  company?: string;
  email: string;
  phone: string;
  address?: string;
  industry?: string;
  status: CustomerStatus;
  tags?: string[];
  assignee?: string;
  notes?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  id: string;
}

export interface CustomerFilter {
  status?: CustomerStatus;
  assignee?: string;
  search?: string;
  tags?: string[];
  offset?: number;
  limit?: number;
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  type: 'call' | 'email' | 'meeting' | 'chat' | 'line' | 'note';
  content: string;
  date: string;
  createdBy: string;
}

class CustomerService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${CUSTOMER_API_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // 顧客一覧取得
  async getCustomers(filter?: CustomerFilter): Promise<{
    customers: Customer[];
    total: number;
    hasMore: boolean;
  }> {
    // Return mock data if API is not configured
    if (!process.env.NEXT_PUBLIC_CUSTOMER_API_URL) {
      return Promise.resolve({
        customers: [
          {
            id: '1',
            name: '田中太郎',
            email: 'tanaka@example.com',
            phone: '090-1234-5678',
            status: 'customer' as CustomerStatus,
            assignee: filter?.assignee || 'sales@test.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: '2',
            name: '佐藤花子',
            email: 'sato@example.com',
            phone: '090-2345-6789',
            status: 'lead' as CustomerStatus,
            assignee: filter?.assignee || 'sales@test.com',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        total: 2,
        hasMore: false,
      });
    }

    const params = new URLSearchParams();

    if (filter?.status) params.append('status', filter.status);
    if (filter?.assignee) params.append('assignee', filter.assignee);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.tags?.length) params.append('tags', filter.tags.join(','));
    if (filter?.offset) params.append('offset', filter.offset.toString());
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const queryString = params.toString();
    const endpoint = `/customers${queryString ? `?${queryString}` : ''}`;

    return this.request<{
      customers: Customer[];
      total: number;
      hasMore: boolean;
    }>(endpoint);
  }

  // 顧客詳細取得
  async getCustomer(id: string): Promise<Customer> {
    return this.request<Customer>(`/customers/${id}`);
  }

  // 新規顧客作成
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    return this.request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // 顧客情報更新
  async updateCustomer(data: UpdateCustomerRequest): Promise<Customer> {
    const { id, ...updateData } = data;
    return this.request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  // 顧客削除
  async deleteCustomer(id: string): Promise<void> {
    await this.request<void>(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  // 顧客インタラクション履歴取得
  async getCustomerInteractions(
    customerId: string,
  ): Promise<CustomerInteraction[]> {
    return this.request<CustomerInteraction[]>(
      `/customers/${customerId}/interactions`,
    );
  }

  // インタラクション追加
  async addInteraction(
    customerId: string,
    interaction: Omit<CustomerInteraction, 'id' | 'customerId'>,
  ): Promise<CustomerInteraction> {
    return this.request<CustomerInteraction>(
      `/customers/${customerId}/interactions`,
      {
        method: 'POST',
        body: JSON.stringify(interaction),
      },
    );
  }

  // 顧客統計取得
  async getCustomerStats(): Promise<{
    total: number;
    byStatus: Record<CustomerStatus, number>;
    recentInteractions: number;
    topAssignees: Array<{ assignee: string; count: number }>;
  }> {
    return this.request<{
      total: number;
      byStatus: Record<CustomerStatus, number>;
      recentInteractions: number;
      topAssignees: Array<{ assignee: string; count: number }>;
    }>('/customers/stats');
  }

  // タグ一覧取得
  async getTags(): Promise<string[]> {
    return this.request<string[]>('/customers/tags');
  }

  // 顧客検索（高度検索）
  async searchCustomers(query: string): Promise<Customer[]> {
    return this.request<Customer[]>(
      `/customers/search?q=${encodeURIComponent(query)}`,
    );
  }

  // 顧客エクスポート
  async exportCustomers(format: 'csv' | 'excel' = 'csv'): Promise<Blob> {
    const response = await fetch(
      `${API_BASE_URL}/customers/export?format=${format}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  // 顧客インポート
  async importCustomers(file: File): Promise<{
    success: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/customers/import`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Import failed');
    }

    return response.json();
  }
}

// シングルトンインスタンス
export const customerService = new CustomerService();
export default customerService;
