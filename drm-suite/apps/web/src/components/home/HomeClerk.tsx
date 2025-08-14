'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, UserPlus, Receipt, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { RAGPanel } from '@/components/rag/RAGPanel';
import { toast } from 'sonner';

interface Todo {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'overdue' | 'due_soon' | 'normal';
  actionUrl?: string;
}

interface ReceptionCard {
  id: string;
  customerName: string;
  phone: string;
  inquiry: string;
  status: 'new' | 'in_progress' | 'completed';
  createdAt: string;
  assignee?: string;
}

interface PendingDocument {
  id: string;
  type: 'estimate' | 'contract' | 'invoice';
  projectName: string;
  customerName: string;
  amount: number;
  dueDate?: string;
  status: 'draft' | 'pending_approval' | 'approved';
}

export function HomeClerk({ planLevel }: { planLevel: 'LITE' | 'STANDARD' | 'PRO' }) {
  const { user, companyId } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [receptionCards, setReceptionCards] = useState<ReceptionCard[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);
  const [customerDialog, setCustomerDialog] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: '',
    kana: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    source: 'direct',
  });

  // データ取得
  useEffect(() => {
    fetchDashboardData();
  }, [companyId]);

  const fetchDashboardData = async () => {
    try {
      const [homeData, receptionData, documentData] = await Promise.all([
        api.get(`/home/${companyId}`),
        api.get(`/reception/cards?status=active`),
        api.get(`/documents/pending`),
      ]);

      setTodos(homeData.data.todos || []);
      setReceptionCards(receptionData.data.cards || []);
      setPendingDocuments(documentData.data.documents || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  // ショートカットキー処理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toUpperCase()) {
        case 'N': // 新規客カード作成
          setCustomerDialog(true);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // 新規客カード作成
  const handleCustomerSubmit = async () => {
    try {
      const response = await api.post(`/companies/${companyId}/customers`, customerData);

      toast.success('新規客カードを作成しました');
      setCustomerDialog(false);
      setCustomerData({
        name: '',
        kana: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        source: 'direct',
      });
      fetchDashboardData();

      // テレメトリ送信
      api.post('/telemetry/customer/created', {
        customerId: response.data.customer.id,
        source: customerData.source,
        metadata: { inputMethod: 'shortcut' },
      });
    } catch (error) {
      toast.error('新規客カード作成に失敗しました');
    }
  };

  // 接客カード処理
  const handleReceptionAction = async (cardId: string, action: string) => {
    try {
      await api.post(`/reception/cards/${cardId}/${action}`);
      toast.success(`カードを${action === 'complete' ? '完了' : '処理'}しました`);
      fetchDashboardData();
    } catch (error) {
      toast.error('処理に失敗しました');
    }
  };

  // Todo色分け
  const getTodoColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800 border-red-300';
      case 'due_soon': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div className="h-screen flex">
      {/* メインコンテンツ */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">事務管理ダッシュボード</h1>
          <p className="text-gray-600 mt-2">
            ショートカット: N(新規客カード)
            <Badge className="ml-4">{planLevel}プラン</Badge>
          </p>
        </div>

        {/* 上段: ToDo一覧 */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="mr-2 h-5 w-5" />
                ToDo（最大6件）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todos.slice(0, 6).map((todo) => (
                  <div
                    key={todo.id}
                    className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getTodoColor(todo.status)}`}
                    onClick={() => api.post('/telemetry/home/todo-clicked', { todoId: todo.id, todoType: todo.priority })}
                  >
                    <h4 className="font-semibold">{todo.title}</h4>
                    <p className="text-sm mt-1">{todo.description}</p>
                    <Badge variant={todo.priority === 'high' ? 'destructive' : 'secondary'} className="mt-2">
                      {todo.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 中段: 接客カードと書類処理 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 接客カード */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5" />
                接客カード
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full mb-4" 
                onClick={() => setCustomerDialog(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                新規客カード作成 (N)
              </Button>
              {receptionCards.map((card) => (
                <div key={card.id} className="mb-4 p-3 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{card.customerName}</h4>
                      <p className="text-sm text-gray-600">{card.phone}</p>
                      <p className="text-sm text-gray-500">{card.inquiry}</p>
                    </div>
                    <Badge variant={card.status === 'new' ? 'default' : 'secondary'}>
                      {card.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="text-sm px-3 py-1"
                      onClick={() => handleReceptionAction(card.id, 'assign')}
                    >
                      担当割当
                    </Button>
                    <Button
                      className="text-sm px-3 py-1"
                      onClick={() => handleReceptionAction(card.id, 'complete')}
                    >
                      完了
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 書類処理 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="mr-2 h-5 w-5" />
                未処理書類
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingDocuments.map((doc) => (
                <div key={doc.id} className="mb-4 p-3 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{doc.projectName}</h4>
                      <p className="text-sm text-gray-600">{doc.customerName}</p>
                      <p className="text-sm font-medium">¥{doc.amount.toLocaleString()}</p>
                    </div>
                    <Badge variant={
                      doc.type === 'estimate' ? 'secondary' : 
                      doc.type === 'contract' ? 'default' : 'destructive'
                    }>
                      {doc.type === 'estimate' ? '見積書' : 
                       doc.type === 'contract' ? '契約書' : '請求書'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button className="text-sm px-3 py-1">
                      確認
                    </Button>
                    {doc.status === 'draft' && (
                      <Button className="text-sm px-3 py-1">
                        承認申請
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 下段: 集計情報 */}
        {planLevel !== 'LITE' && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">今月の受注額</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥12,450,000</div>
                <p className="text-xs text-muted-foreground">前月比 +15%</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">未回収金額</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">¥3,200,000</div>
                <p className="text-xs text-muted-foreground">5件</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">本日の来客数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">新規: 3, 既存: 5</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 右: RAGパネル */}
      <div className="w-96 border-l">
        <RAGPanel role="clerk" presets={['clerk-customer-search', 'clerk-document-template', 'clerk-payment-status']} />
      </div>

      {/* 新規客カード作成ダイアログ */}
      <Dialog open={customerDialog} onOpenChange={setCustomerDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>新規客カード作成 (ショートカット: N)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">氏名 *</label>
                <Input
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  placeholder="山田太郎"
                />
              </div>
              <div>
                <label className="text-sm font-medium">フリガナ</label>
                <Input
                  value={customerData.kana}
                  onChange={(e) => setCustomerData({ ...customerData, kana: e.target.value })}
                  placeholder="ヤマダタロウ"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">電話番号 *</label>
                <Input
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  placeholder="090-1234-5678"
                />
              </div>
              <div>
                <label className="text-sm font-medium">メール</label>
                <Input
                  type="email"
                  value={customerData.email}
                  onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                  placeholder="yamada@example.com"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">住所</label>
              <Input
                value={customerData.address}
                onChange={(e) => setCustomerData({ ...customerData, address: e.target.value })}
                placeholder="東京都渋谷区..."
              />
            </div>
            <div>
              <label className="text-sm font-medium">来店経路</label>
              <select
                className="w-full p-2 border rounded"
                value={customerData.source}
                onChange={(e) => setCustomerData({ ...customerData, source: e.target.value })}
              >
                <option value="direct">直接来店</option>
                <option value="web">ウェブサイト</option>
                <option value="referral">紹介</option>
                <option value="phone">電話</option>
                <option value="other">その他</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">備考</label>
              <Textarea
                value={customerData.notes}
                onChange={(e) => setCustomerData({ ...customerData, notes: e.target.value })}
                placeholder="お問い合わせ内容など"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setCustomerDialog(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCustomerSubmit}>
                作成
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}