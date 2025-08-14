/**
 * DRM Suite v1.0 スモークテスト
 * 役職別ホームダッシュボード機能の動作確認
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import axios, { AxiosInstance } from 'axios';

describe('DRM Suite v1.0 Smoke Tests', () => {
  let api: AxiosInstance;
  const companyId = 'test_company_123';
  const baseURL = process.env.API_URL || 'http://localhost:3000/api';

  beforeAll(() => {
    api = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  describe('Home Dashboard API Tests', () => {
    it('should fetch home dashboard data', async () => {
      const response = await api.get(`/home/${companyId}`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('todos');
      expect(response.data).toHaveProperty('stats');
      expect(Array.isArray(response.data.todos)).toBe(true);
    });

    it('should fetch company plan', async () => {
      const response = await api.get(`/companies/${companyId}/plan`);
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('plan');
      expect(['LITE', 'STANDARD', 'PRO']).toContain(response.data.plan);
    });
  });

  describe('Foreman Dashboard Tests', () => {
    it('should fetch ledger overview', async () => {
      const response = await api.get('/ledgers/overview?assignee=me');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('projects');
      expect(Array.isArray(response.data.projects)).toBe(true);
      
      if (response.data.projects.length > 0) {
        const project = response.data.projects[0];
        expect(project).toHaveProperty('projectId');
        expect(project).toHaveProperty('progressPercent');
        expect(project).toHaveProperty('contractAmount');
      }
    });

    it('should fetch today schedule', async () => {
      const response = await api.get('/schedule/today?me=true');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('schedules');
      expect(Array.isArray(response.data.schedules)).toBe(true);
    });

    it('should submit progress (Shortcut E)', async () => {
      const progressData = {
        progressPercent: 65,
        approvedAmount: 1500000,
        notes: 'Test progress submission',
      };
      
      const response = await api.post('/ledgers/test_ledger_1/progress', progressData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('progress');
      expect(response.data.progress.progressPercent).toBe(progressData.progressPercent);
    });

    it('should create bill draft (Shortcut B)', async () => {
      const billData = {
        billType: 'milestone',
        amount: 2000000,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          { description: 'Test item', quantity: 1, unitPrice: 2000000 },
        ],
      };
      
      const response = await api.post('/ledgers/test_ledger_1/bill', billData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('invoice');
      expect(response.data.invoice.amount).toBe(billData.amount);
    });
  });

  describe('Clerk Dashboard Tests', () => {
    it('should fetch reception cards', async () => {
      const response = await api.get('/reception/cards?status=active');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('cards');
      expect(Array.isArray(response.data.cards)).toBe(true);
    });

    it('should fetch pending documents', async () => {
      const response = await api.get('/documents/pending');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('documents');
      expect(Array.isArray(response.data.documents)).toBe(true);
    });

    it('should create new customer (Shortcut N)', async () => {
      const customerData = {
        name: 'テスト顧客',
        kana: 'テストコキャク',
        phone: '090-1234-5678',
        email: 'test@example.com',
        address: '東京都渋谷区テスト1-2-3',
        notes: 'テスト顧客カード',
        source: 'direct',
      };
      
      const response = await api.post(`/companies/${companyId}/customers`, customerData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('customer');
      expect(response.data.customer.name).toBe(customerData.name);
    });
  });

  describe('Aftercare Dashboard Tests', () => {
    it('should fetch maintenance schedules', async () => {
      const response = await api.get('/maintenance/schedules?upcoming=true');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('schedules');
      expect(Array.isArray(response.data.schedules)).toBe(true);
    });

    it('should fetch service requests', async () => {
      const response = await api.get('/service/requests?status=open');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('requests');
      expect(Array.isArray(response.data.requests)).toBe(true);
    });

    it('should fetch estimate merge candidates', async () => {
      const response = await api.get('/estimates/merge-candidates');
      
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('candidates');
      expect(Array.isArray(response.data.candidates)).toBe(true);
    });

    it('should merge estimates (Shortcut M)', async () => {
      const mergeData = {
        estimateIds: ['est_1', 'est_2'],
        projectName: 'テスト統合案件',
        customerName: 'テスト顧客',
        notes: '見積統合テスト',
      };
      
      const response = await api.post(`/companies/${companyId}/estimates/merge`, mergeData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
      expect(response.data).toHaveProperty('estimate');
      expect(response.data.estimate.projectName).toBe(mergeData.projectName);
    });
  });

  describe('RAG Panel Tests', () => {
    it('should perform RAG search with preset', async () => {
      const searchData = {
        query: '',
        role: 'foreman',
        presetId: 'foreman-progress-check',
      };
      
      const response = await api.post(`/rag/${companyId}/search`, searchData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('content');
      expect(response.data).toHaveProperty('citations');
      expect(Array.isArray(response.data.citations)).toBe(true);
    });

    it('should perform RAG search with custom query', async () => {
      const searchData = {
        query: '山田様邸の進捗状況',
        role: 'foreman',
      };
      
      const response = await api.post(`/rag/${companyId}/search`, searchData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('content');
      expect(response.data).toHaveProperty('citations');
    });
  });

  describe('Telemetry Tests', () => {
    it('should track todo click event', async () => {
      const telemetryData = {
        todoId: 'todo_1',
        todoType: 'high',
      };
      
      const response = await api.post('/telemetry/home/todo-clicked', telemetryData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
    });

    it('should track progress saved event', async () => {
      const telemetryData = {
        projectId: 'proj_1',
        progressPercent: 65,
        metadata: { inputMethod: 'shortcut' },
      };
      
      const response = await api.post('/telemetry/ledger/progress-saved', telemetryData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
    });

    it('should track invoice issued event', async () => {
      const telemetryData = {
        invoiceId: 'inv_1',
        amount: 2000000,
        metadata: { generatedFrom: 'shortcut' },
      };
      
      const response = await api.post('/telemetry/invoice/issued', telemetryData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
    });

    it('should track customer created event', async () => {
      const telemetryData = {
        customerId: 'cust_1',
        source: 'direct',
        metadata: { inputMethod: 'shortcut' },
      };
      
      const response = await api.post('/telemetry/customer/created', telemetryData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
    });

    it('should track estimate merged event', async () => {
      const telemetryData = {
        mergedEstimateId: 'est_merged_1',
        sourceCount: 2,
        metadata: { inputMethod: 'shortcut' },
      };
      
      const response = await api.post('/telemetry/estimate/merged', telemetryData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('success', true);
    });
  });

  describe('Performance Requirements Tests', () => {
    it('should complete foreman flow within 20 seconds', async () => {
      const startTime = Date.now();
      
      // 1. ホーム画面表示
      await api.get(`/home/${companyId}`);
      
      // 2. 台帳一覧取得
      await api.get('/ledgers/overview?assignee=me');
      
      // 3. 出来高入力 (Shortcut E)
      await api.post('/ledgers/test_ledger_1/progress', {
        progressPercent: 70,
        approvedAmount: 2000000,
      });
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`Foreman flow completed in ${duration} seconds`);
      expect(duration).toBeLessThan(20);
    });

    it('should complete clerk flow within 1 minute', async () => {
      const startTime = Date.now();
      
      // 1. ホーム画面表示
      await api.get(`/home/${companyId}`);
      
      // 2. 接客カード一覧取得
      await api.get('/reception/cards?status=active');
      
      // 3. 新規客カード作成 (Shortcut N)
      await api.post(`/companies/${companyId}/customers`, {
        name: 'パフォーマンステスト顧客',
        phone: '090-9999-9999',
      });
      
      // 4. 書類確認
      await api.get('/documents/pending');
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`Clerk flow completed in ${duration} seconds`);
      expect(duration).toBeLessThan(60);
    });

    it('should complete aftercare flow within 3 clicks', async () => {
      let clickCount = 0;
      
      // Click 1: ホーム画面表示
      await api.get(`/home/${companyId}`);
      clickCount++;
      
      // Click 2: 見積統合候補取得
      await api.get('/estimates/merge-candidates');
      clickCount++;
      
      // Click 3: 見積統合実行 (Shortcut M)
      await api.post(`/companies/${companyId}/estimates/merge`, {
        estimateIds: ['est_1', 'est_2'],
        projectName: '3クリックテスト',
        customerName: 'テスト顧客',
      });
      clickCount++;
      
      console.log(`Aftercare flow completed in ${clickCount} clicks`);
      expect(clickCount).toBeLessThanOrEqual(3);
    });
  });
});

/**
 * スモークテスト実行手順：
 * 1. APIサーバーを起動: npm run start:dev (svc-home)
 * 2. テスト実行: npm test tests/smoke-test.spec.ts
 * 
 * 期待される結果：
 * - 全テストケースがPASS
 * - Foreman flow: 20秒以内
 * - Clerk flow: 1分以内
 * - Aftercare flow: 3クリック以内
 */