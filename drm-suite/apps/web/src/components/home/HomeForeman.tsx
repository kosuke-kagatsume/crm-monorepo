'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
// import { useAuth } from '@/hooks/useAuth';
// import { api } from '@/lib/api';
// import { RAGPanel } from '@/components/rag/RAGPanel';
// import { toast } from 'sonner';

interface Todo {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'overdue' | 'due_soon' | 'normal';
  actionUrl?: string;
}

interface LedgerOverview {
  projectId: string;
  projectName: string;
  progressPercent: number;
  contractAmount: number;
  approvedAmount: number;
  pendingInvoices: number;
  isDelayed: boolean;
}

export function HomeForeman({ planLevel }: { planLevel: 'LITE' | 'STANDARD' | 'PRO' }) {
  // const { user, companyId } = useAuth();
  const user = { id: '1', name: 'テストユーザー', email: 'test@example.com', role: 'foreman' };
  const companyId = 'test_company_123';
  const [todos, setTodos] = useState<Todo[]>([]);
  const [ledgers, setLedgers] = useState<LedgerOverview[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [progressDialog, setProgressDialog] = useState(false);
  const [billDialog, setBillDialog] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<LedgerOverview | null>(null);
  const [progressData, setProgressData] = useState({ percent: 0, amount: 0, notes: '' });
  const [billData, setBillData] = useState({ type: 'milestone', amount: 0, dueDate: '', items: [] });

  // データ取得（モックデータ）
  useEffect(() => {
    // モックデータを設定
    setTodos([
      {
        id: '1',
        title: '見積書承認待ち',
        description: '山田様邸の見積書承認が必要です',
        priority: 'high',
        status: 'due_soon',
      },
      {
        id: '2',
        title: '安全点検実施',
        description: '田中様邸の定期安全点検',
        priority: 'medium',
        status: 'normal',
      },
    ]);
    
    setTodaySchedule([
      {
        id: 'sch_1',
        projectName: '山田様邸',
        customerName: '山田太郎',
        location: '東京都渋谷区',
        status: '作業中',
      },
    ]);
    
    setLedgers([
      {
        projectId: 'proj_1',
        projectName: '山田様邸新築工事',
        progressPercent: 65,
        contractAmount: 15000000,
        approvedAmount: 9750000,
        pendingInvoices: 2,
        isDelayed: false,
      },
    ]);
  }, []);

  // ショートカットキー処理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toUpperCase()) {
        case 'E': // 出来高入力
          if (ledgers.length > 0) {
            setSelectedLedger(ledgers[0]);
            setProgressDialog(true);
          }
          break;
        case 'C': // 変更工事起票
          if (planLevel !== 'LITE') {
            handleChangeOrder();
          }
          break;
        case 'B': // 請求案作成
          if (ledgers.length > 0) {
            setSelectedLedger(ledgers[0]);
            setBillDialog(true);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [ledgers, planLevel]);

  // 出来高登録
  const handleProgressSubmit = async () => {
    if (!selectedLedger) return;

    try {
      // モック処理
      console.log('出来高登録:', progressData);
      alert('出来高を登録しました');
      setProgressDialog(false);
    } catch (error) {
      alert('出来高登録に失敗しました');
    }
  };

  // 請求案作成
  const handleBillSubmit = async () => {
    if (!selectedLedger) return;

    try {
      // モック処理
      console.log('請求案作成:', billData);
      alert('請求案を作成しました');
      setBillDialog(false);
    } catch (error) {
      alert('請求案作成に失敗しました');
    }
  };

  // 変更工事起票
  const handleChangeOrder = async () => {
    if (planLevel === 'LITE') {
      alert('この機能はSTANDARDプラン以上で利用可能です');
      return;
    }
    // 変更工事起票ダイアログを開く
    alert('変更工事起票機能は準備中です');
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
          <h1 className="text-3xl font-bold">施工管理ダッシュボード</h1>
          <p className="text-gray-600 mt-2">
            ショートカット: E(出来高) / C(変更工事) / B(請求)
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
                    onClick={() => console.log('Todo clicked:', todo.id)}
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

        {/* 中段: 台帳カード */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 今日の現場 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                今日の現場
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaySchedule.map((schedule) => (
                <div key={schedule.id} className="mb-4 p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{schedule.projectName}</h4>
                      <p className="text-sm text-gray-600">{schedule.customerName}</p>
                      <p className="text-sm text-gray-500">{schedule.location}</p>
                    </div>
                    <Badge>{schedule.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 台帳進捗 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                台帳進捗
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ledgers.map((ledger) => (
                <div key={ledger.projectId} className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">{ledger.projectName}</h4>
                    {ledger.isDelayed && <Badge variant="destructive">遅延</Badge>}
                  </div>
                  <Progress value={ledger.progressPercent} className="h-2 mb-2" />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>進捗: {ledger.progressPercent}%</span>
                    <span>承認済: ¥{ledger.approvedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      className="text-sm px-3 py-1"
                      onClick={() => {
                        setSelectedLedger(ledger);
                        setProgressDialog(true);
                      }}
                    >
                      出来高入力
                    </Button>
                    <Button
                      className="text-sm px-3 py-1"
                      onClick={() => {
                        setSelectedLedger(ledger);
                        setBillDialog(true);
                      }}
                    >
                      請求案
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 右: RAGパネル */}
      <div className="w-96 border-l bg-gray-50 p-4">
        <div className="text-center text-gray-500">
          <h3 className="font-semibold mb-2">RAGアシスタント</h3>
          <p className="text-sm">プリセットボタンで検索</p>
        </div>
      </div>

      {/* 出来高入力ダイアログ */}
      <Dialog open={progressDialog} onOpenChange={setProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>出来高進捗登録 (ショートカット: E)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">進捗率 (%)</label>
              <Input
                type="number"
                value={progressData.percent}
                onChange={(e) => setProgressData({ ...progressData, percent: Number(e.target.value) })}
                placeholder="0-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium">承認金額</label>
              <Input
                type="number"
                value={progressData.amount}
                onChange={(e) => setProgressData({ ...progressData, amount: Number(e.target.value) })}
                placeholder="金額を入力"
              />
            </div>
            <div>
              <label className="text-sm font-medium">備考</label>
              <Textarea
                value={progressData.notes}
                onChange={(e) => setProgressData({ ...progressData, notes: e.target.value })}
                placeholder="備考を入力"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setProgressDialog(false)}>
                キャンセル
              </Button>
              <Button onClick={handleProgressSubmit}>
                登録
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 請求案作成ダイアログ */}
      <Dialog open={billDialog} onOpenChange={setBillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>請求案作成 (ショートカット: B)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">請求タイプ</label>
              <select
                className="w-full p-2 border rounded"
                value={billData.type}
                onChange={(e) => setBillData({ ...billData, type: e.target.value })}
              >
                <option value="milestone">マイルストーン</option>
                <option value="percent_complete">出来高</option>
                <option value="final">最終</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">請求金額</label>
              <Input
                type="number"
                value={billData.amount}
                onChange={(e) => setBillData({ ...billData, amount: Number(e.target.value) })}
                placeholder="金額を入力"
              />
            </div>
            <div>
              <label className="text-sm font-medium">支払期限</label>
              <Input
                type="date"
                value={billData.dueDate}
                onChange={(e) => setBillData({ ...billData, dueDate: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setBillDialog(false)}>
                キャンセル
              </Button>
              <Button onClick={handleBillSubmit}>
                作成
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}