/**
 * Expense Service - 経費管理API
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3007';

export interface ExpenseCategory {
  id: string;
  companyId: string;
  name: string;
  code: string;
  parentId?: string;
  isActive: boolean;
  parent?: ExpenseCategory;
  children?: ExpenseCategory[];
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  companyId: string;
  storeId?: string;
  userId: string;
  categoryId: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  expenseDate: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
  projectId?: string;
  vendorId?: string;
  receiptUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  category: ExpenseCategory;
  user: any;
  approver?: any;
  approvalHistory?: ExpenseApproval[];
  attachments?: ExpenseAttachment[];
}

export interface CreateExpenseDto {
  companyId: string;
  storeId?: string;
  userId: string;
  categoryId: string;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  expenseDate: string;
  projectId?: string;
  vendorId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateExpenseDto extends Partial<CreateExpenseDto> {
  status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
}

export interface ExpenseFilter {
  companyId?: string;
  storeId?: string;
  userId?: string;
  categoryId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ExpenseApproval {
  id: string;
  expenseId: string;
  userId: string;
  action: 'approve' | 'reject' | 'request_info';
  comment?: string;
  createdAt: string;
  user: any;
}

export interface CreateApprovalDto {
  expenseId: string;
  action: 'approve' | 'reject' | 'request_info';
  comment?: string;
}

export interface ExpenseAttachment {
  id: string;
  expenseId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface Budget {
  id: string;
  companyId: string;
  categoryId: string;
  fiscal: string;
  amount: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: ExpenseCategory;
}

export interface CreateBudgetDto {
  companyId: string;
  categoryId: string;
  fiscal: string;
  amount: number;
  currency?: string;
}

export interface ExpenseReport {
  summary: {
    totalAmount: number;
    totalExpenses: number;
    approvedAmount: number;
    pendingAmount: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
  };
  period: {
    start: string;
    end: string;
  };
  expenses?: Expense[];
}

export interface PaymentMethod {
  id: string;
  companyId: string;
  name: string;
  type: string;
  details: Record<string, any>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

class ExpenseService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Expense Categories
  async getExpenseCategories(companyId: string): Promise<ExpenseCategory[]> {
    const response = await this.api.get(`/expense-categories`, {
      params: { companyId },
    });
    return response.data;
  }

  async createExpenseCategory(
    data: Partial<ExpenseCategory>,
  ): Promise<ExpenseCategory> {
    const response = await this.api.post('/expense-categories', data);
    return response.data;
  }

  // Expenses
  async getExpenses(
    filter?: ExpenseFilter,
  ): Promise<{ items: Expense[]; total: number }> {
    const response = await this.api.get('/expenses', { params: filter });
    return response.data;
  }

  async getExpenseById(id: string): Promise<Expense> {
    const response = await this.api.get(`/expenses/${id}`);
    return response.data;
  }

  async createExpense(data: CreateExpenseDto): Promise<Expense> {
    const response = await this.api.post('/expenses', data);
    return response.data;
  }

  async updateExpense(id: string, data: UpdateExpenseDto): Promise<Expense> {
    const response = await this.api.patch(`/expenses/${id}`, data);
    return response.data;
  }

  async deleteExpense(id: string): Promise<void> {
    await this.api.delete(`/expenses/${id}`);
  }

  async submitExpense(id: string): Promise<Expense> {
    const response = await this.api.post(`/expenses/${id}/submit`);
    return response.data;
  }

  // Expense Approvals
  async approveExpense(data: CreateApprovalDto): Promise<ExpenseApproval> {
    const response = await this.api.post('/expense-approvals', data);
    return response.data;
  }

  async getPendingApprovals(userId: string): Promise<Expense[]> {
    const response = await this.api.get(`/expense-approvals/pending/${userId}`);
    return response.data;
  }

  async bulkApprove(expenseIds: string[], userId: string): Promise<any> {
    const response = await this.api.post('/expense-approvals/bulk', {
      expenseIds,
      userId,
      action: 'approve',
    });
    return response.data;
  }

  // Budgets
  async getBudgets(companyId: string, fiscal?: string): Promise<Budget[]> {
    const response = await this.api.get('/budgets', {
      params: { companyId, fiscal },
    });
    return response.data;
  }

  async createBudget(data: CreateBudgetDto): Promise<Budget> {
    const response = await this.api.post('/budgets', data);
    return response.data;
  }

  async getBudgetAnalysis(companyId: string, fiscal: string): Promise<any> {
    const response = await this.api.get(`/budgets/analysis/${companyId}`, {
      params: { fiscal },
    });
    return response.data;
  }

  // Reports
  async getExpenseReport(
    companyId: string,
    startDate: string,
    endDate: string,
    options?: any,
  ): Promise<ExpenseReport> {
    const response = await this.api.get('/expense-reports/summary', {
      params: { companyId, startDate, endDate, ...options },
    });
    return response.data;
  }

  async getExpenseAnalytics(companyId: string, period: string): Promise<any> {
    const response = await this.api.get(
      `/expense-reports/analytics/${companyId}`,
      {
        params: { period },
      },
    );
    return response.data;
  }

  // Attachments
  async uploadAttachment(
    expenseId: string,
    file: File,
  ): Promise<ExpenseAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('expenseId', expenseId);

    const response = await this.api.post(
      '/expense-attachments/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );
    return response.data;
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.api.delete(`/expense-attachments/${id}`);
  }

  // Payment Methods
  async getPaymentMethods(companyId: string): Promise<PaymentMethod[]> {
    const response = await this.api.get('/payment-methods', {
      params: { companyId },
    });
    return response.data;
  }

  async createPaymentMethod(
    data: Partial<PaymentMethod>,
  ): Promise<PaymentMethod> {
    const response = await this.api.post('/payment-methods', data);
    return response.data;
  }
}

export const expenseService = new ExpenseService();
