'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Phone, FileText, AlertCircle, Wrench, ClipboardList } from 'lucide-react';
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

interface MaintenanceSchedule {
  id: string;
  projectId: string;
  projectName: string;
  customerName: string;
  address: string;
  scheduledDate: string;
  type: 'regular' | 'emergency' | 'warranty';
  status: 'scheduled' | 'in_progress' | 'completed';
  notes?: string;
}

interface ServiceRequest {
  id: string;
  customerName: string;
  phone: string;
  issueType: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'new' | 'assigned' | 'resolved';
  createdAt: string;
}

interface EstimateMergeCandidate {
  id: string;
  estimateId: string;
  projectName: string;
  amount: number;
  items: number;
  createdAt: string;
}

export function HomeAftercare({ planLevel }: { planLevel: 'LITE' | 'STANDARD' | 'PRO' }) {
  const { user, companyId } = useAuth();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [mergeDialog, setMergeDialog] = useState(false);
  const [mergeCandidates, setMergeCandidates] = useState<EstimateMergeCandidate[]>([]);
  const [selectedEstimates, setSelectedEstimates] = useState<string[]>([]);
  const [mergeData, setMergeData] = useState({
    projectName: '',
    customerName: '',
    notes: '',
  });

  // データ取得
  useEffect(() => {
    fetchDashboardData();
  }, [companyId]);

  const fetchDashboardData = async () => {
    try {
      const [homeData, maintenanceData, serviceData] = await Promise.all([
        api.get(`/home/${companyId}`),
        api.get(`/maintenance/schedules?upcoming=true`),
        api.get(`/service/requests?status=open`),
      ]);

      setTodos(homeData.data.todos || []);
      setMaintenanceSchedules(maintenanceData.data.schedules || []);
      setServiceRequests(serviceData.data.requests || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  // ショートカットキー処理
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toUpperCase()) {
        case 'M': // 見積統合
          if (planLevel !== 'LITE') {
            handleMergeEstimates();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [planLevel]);

  // 見積統合
  const handleMergeEstimates = async () => {
    if (planLevel === 'LITE') {
      toast.error('この機能はSTANDARDプラン以上で利用可能です');
      return;
    }

    try {
      const response = await api.get(`/estimates/merge-candidates`);
      setMergeCandidates(response.data.candidates || []);
      setMergeDialog(true);
    } catch (error) {
      toast.error('統合候補の取得に失敗しました');
    }
  };

  // 見積統合実行
  const handleMergeSubmit = async () => {
    if (selectedEstimates.length < 2) {
      toast.error('2つ以上の見積を選択してください');
      return;
    }

    try {
      const response = await api.post(`/companies/${companyId}/estimates/merge`, {
        estimateIds: selectedEstimates,
        projectName: mergeData.projectName,
        customerName: mergeData.customerName,
        notes: mergeData.notes,
      });

      toast.success('見積を統合しました');
      setMergeDialog(false);
      setSelectedEstimates([]);
      setMergeData({ projectName: '', customerName: '', notes: '' });
      fetchDashboardData();

      // テレメトリ送信
      api.post('/telemetry/estimate/merged', {
        mergedEstimateId: response.data.estimate.id,
        sourceCount: selectedEstimates.length,
        metadata: { inputMethod: 'shortcut' },
      });
    } catch (error) {
      toast.error('見積統合に失敗しました');
    }
  };

  // メンテナンス完了処理
  const handleMaintenanceComplete = async (scheduleId: string) => {
    try {
      await api.post(`/maintenance/schedules/${scheduleId}/complete`);
      toast.success('メンテナンスを完了しました');
      fetchDashboardData();
    } catch (error) {
      toast.error('処理に失敗しました');
    }
  };

  // サービスリクエスト処理
  const handleServiceAction = async (requestId: string, action: string) => {
    try {
      await api.post(`/service/requests/${requestId}/${action}`);
      toast.success(`リクエストを${action === 'assign' ? '割当' : '解決'}しました`);
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

  // 優先度バッジ色
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  return (
    <div className="h-screen flex">
      {/* メインコンテンツ */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">アフターケアダッシュボード</h1>
          <p className="text-gray-600 mt-2">
            ショートカット: M(見積統合)
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

        {/* 中段: メンテナンススケジュールとサービスリクエスト */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* メンテナンススケジュール */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                メンテナンススケジュール
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceSchedules.map((schedule) => (
                <div key={schedule.id} className="mb-4 p-3 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{schedule.projectName}</h4>
                      <p className="text-sm text-gray-600">{schedule.customerName}</p>
                      <p className="text-sm text-gray-500">{schedule.address}</p>
                      <p className="text-sm mt-1">
                        予定日: {new Date(schedule.scheduledDate).toLocaleDateString('ja-JP')}
                      </p>
                    </div>
                    <Badge variant={
                      schedule.type === 'emergency' ? 'destructive' :
                      schedule.type === 'warranty' ? 'default' : 'secondary'
                    }>
                      {schedule.type === 'emergency' ? '緊急' :
                       schedule.type === 'warranty' ? '保証' : '定期'}
                    </Badge>
                  </div>
                  {schedule.status === 'scheduled' && (
                    <div className="flex gap-2">
                      <Button
                        className="text-sm px-3 py-1"
                        onClick={() => handleMaintenanceComplete(schedule.id)}
                      >
                        完了
                      </Button>
                      <Button className="text-sm px-3 py-1">
                        連絡
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* サービスリクエスト */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="mr-2 h-5 w-5" />
                サービスリクエスト
              </CardTitle>
            </CardHeader>
            <CardContent>
              {serviceRequests.map((request) => (
                <div key={request.id} className="mb-4 p-3 border rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{request.customerName}</h4>
                      <p className="text-sm text-gray-600">{request.phone}</p>
                      <p className="text-sm font-medium mt-1">{request.issueType}</p>
                      <p className="text-sm text-gray-500">{request.description}</p>
                    </div>
                    <Badge variant={getPriorityVariant(request.priority)}>
                      {request.priority}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'new' && (
                      <Button
                        className="text-sm px-3 py-1"
                        onClick={() => handleServiceAction(request.id, 'assign')}
                      >
                        担当割当
                      </Button>
                    )}
                    <Button
                      className="text-sm px-3 py-1"
                      onClick={() => handleServiceAction(request.id, 'resolve')}
                    >
                      解決
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* 下段: 統計情報と見積統合 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">今月のメンテナンス</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24件</div>
              <p className="text-xs text-muted-foreground">完了: 18, 予定: 6</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">サービスリクエスト</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12件</div>
              <p className="text-xs text-muted-foreground">緊急: 2, 通常: 10</p>
            </CardContent>
          </Card>
          {planLevel !== 'LITE' && (
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleMergeEstimates}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center">
                  <ClipboardList className="mr-1 h-4 w-4" />
                  見積統合 (M)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">統合可能</div>
                <p className="text-xs text-muted-foreground">クリックで開始</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* 右: RAGパネル */}
      <div className="w-96 border-l">
        <RAGPanel role="aftercare" presets={['aftercare-maintenance-history', 'aftercare-warranty-check', 'aftercare-repair-guide']} />
      </div>

      {/* 見積統合ダイアログ */}
      <Dialog open={mergeDialog} onOpenChange={setMergeDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>見積統合 (ショートカット: M)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>統合する見積を選択</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                {mergeCandidates.map((candidate) => (
                  <div key={candidate.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedEstimates.includes(candidate.estimateId)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedEstimates([...selectedEstimates, candidate.estimateId]);
                        } else {
                          setSelectedEstimates(selectedEstimates.filter(id => id !== candidate.estimateId));
                        }
                      }}
                    />
                    <label className="flex-1 cursor-pointer">
                      <div className="font-medium">{candidate.projectName}</div>
                      <div className="text-sm text-gray-500">
                        ¥{candidate.amount.toLocaleString()} / {candidate.items}項目
                      </div>
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                選択済み: {selectedEstimates.length}件
              </p>
            </div>
            <div>
              <Label>統合後の案件名</Label>
              <Input
                value={mergeData.projectName}
                onChange={(e) => setMergeData({ ...mergeData, projectName: e.target.value })}
                placeholder="統合案件名を入力"
              />
            </div>
            <div>
              <Label>顧客名</Label>
              <Input
                value={mergeData.customerName}
                onChange={(e) => setMergeData({ ...mergeData, customerName: e.target.value })}
                placeholder="顧客名を入力"
              />
            </div>
            <div>
              <Label>備考</Label>
              <Textarea
                value={mergeData.notes}
                onChange={(e) => setMergeData({ ...mergeData, notes: e.target.value })}
                placeholder="統合に関する備考"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setMergeDialog(false)}>
                キャンセル
              </Button>
              <Button onClick={handleMergeSubmit} disabled={selectedEstimates.length < 2}>
                統合実行
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}