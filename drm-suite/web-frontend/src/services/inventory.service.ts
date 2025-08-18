/**
 * Inventory Service - 在庫管理API
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

export interface InventoryItem {
  id: string;
  companyId: string;
  storeId: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  attributes?: Record<string, any>;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  location?: string;
  isActive: boolean;
  lowStock?: boolean;
  overStock?: boolean;
  stockStatus?: 'low' | 'over' | 'normal';
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryDto {
  companyId: string;
  storeId: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  attributes?: Record<string, any>;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  location?: string;
  isActive?: boolean;
}

export interface UpdateInventoryDto extends Partial<CreateInventoryDto> {}

export interface InventoryFilter {
  companyId?: string;
  storeId?: string;
  category?: string;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
  limit?: number;
  offset?: number;
}

export interface StockMovement {
  id: string;
  inventoryId: string;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  reason: string;
  reference?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CreateStockMovementDto {
  inventoryId: string;
  type: 'in' | 'out' | 'adjust';
  quantity: number;
  reason: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface StockCount {
  id: string;
  inventoryId: string;
  sessionId: string;
  countedQty: number;
  systemQty: number;
  variance: number;
  status: 'pending' | 'approved' | 'rejected';
  countedBy: string;
  countedAt: string;
  createdAt: string;
}

export interface CreateStockCountDto {
  inventoryId: string;
  sessionId: string;
  countedQty: number;
  countedBy: string;
  countedAt?: string;
}

class InventoryService {
  private api = axios.create({
    baseURL: `${API_BASE_URL}/inventory`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Inventory CRUD
  async createInventory(data: CreateInventoryDto): Promise<InventoryItem> {
    const response = await this.api.post('/', data);
    return response.data;
  }

  async getInventories(
    filter?: InventoryFilter,
  ): Promise<{ items: InventoryItem[]; total: number }> {
    const response = await this.api.get('/', { params: filter });
    return response.data;
  }

  async getInventoryById(id: string): Promise<InventoryItem> {
    const response = await this.api.get(`/${id}`);
    return response.data;
  }

  async updateInventory(
    id: string,
    data: UpdateInventoryDto,
  ): Promise<InventoryItem> {
    const response = await this.api.patch(`/${id}`, data);
    return response.data;
  }

  async deleteInventory(id: string): Promise<void> {
    await this.api.delete(`/${id}`);
  }

  // Stock Management
  async getLowStockItems(
    companyId: string,
    storeId?: string,
  ): Promise<InventoryItem[]> {
    const response = await this.api.get(`/low-stock/${companyId}`, {
      params: { storeId },
    });
    return response.data;
  }

  async getInventoryValue(companyId: string, storeId?: string): Promise<any> {
    const response = await this.api.get(`/value/${companyId}`, {
      params: { storeId },
    });
    return response.data;
  }

  // Stock Movements
  async createStockMovement(
    data: CreateStockMovementDto,
  ): Promise<StockMovement> {
    const response = await this.api.post('/movement', data);
    return response.data;
  }

  async getStockMovements(
    inventoryId: string,
    limit = 20,
    offset = 0,
  ): Promise<{ items: StockMovement[]; total: number }> {
    const response = await this.api.get(`/${inventoryId}/movements`, {
      params: { limit, offset },
    });
    return response.data;
  }

  // Stock Counts
  async createStockCount(data: CreateStockCountDto): Promise<StockCount> {
    const response = await this.api.post('/count', data);
    return response.data;
  }

  async updateStockCount(
    id: string,
    status: 'approved' | 'rejected',
  ): Promise<any> {
    const response = await this.api.patch(`/count/${id}`, { status });
    return response.data;
  }

  async getStockCounts(
    inventoryId: string,
    sessionId?: string,
  ): Promise<StockCount[]> {
    const response = await this.api.get(`/${inventoryId}/counts`, {
      params: { sessionId },
    });
    return response.data;
  }
}

export const inventoryService = new InventoryService();
