'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  Users,
  Calendar,
  CheckSquare,
  AlertTriangle,
  TrendingUp,
  FileText,
  Phone,
  Wrench,
  Shield,
  DollarSign,
  Car,
  Building,
  Sparkles,
} from 'lucide-react';
import { WidgetId } from '@/config/roleDashboard';

interface DashboardWidgetProps {
  widgetId: WidgetId;
  title?: string;
  onAction?: (action: string, data?: any) => void;
}

export function DashboardWidget({ widgetId, title, onAction }: DashboardWidgetProps) {
  const getIcon = (widgetId: WidgetId) => {
    switch (widgetId) {
      case 'kpi':
        return <TrendingUp className="h-4 w-4" />;
      case 'alerts':
        return <AlertTriangle className="h-4 w-4" />;
      case 'todo':
        return <CheckSquare className="h-4 w-4" />;
      case 'projectsSnap':
        return <BarChart3 className="h-4 w-4" />;
      case 'reception':
        return <Building className="h-4 w-4" />;
      case 'booking':
        return <Calendar className="h-4 w-4" />;
      case 'ledgerActions':
        return <FileText className="h-4 w-4" />;
      case 'accountingPanel':
        return <DollarSign className="h-4 w-4" />;
      case 'marketingPanel':
        return <Users className="h-4 w-4" />;
      case 'aftercareFlow':
        return <Wrench className="h-4 w-4" />;
      case 'ragToggle':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTitle = (widgetId: WidgetId) => {
    if (title) return title;
    
    switch (widgetId) {
      case 'kpi':
        return 'KPI';
      case 'alerts':
        return 'アラート';
      case 'todo':
        return '今日やること';
      case 'projectsSnap':
        return '案件スナップ';
      case 'reception':
        return '受付カウンター';
      case 'booking':
        return '予約状況';
      case 'ledgerActions':
        return '台帳操作';
      case 'accountingPanel':
        return '経理パネル';
      case 'marketingPanel':
        return 'マーケティング';
      case 'aftercareFlow':
        return 'アフターケア';
      case 'ragToggle':
        return 'RAG検索';
      default:
        return 'ウィジェット';
    }
  };

  const renderContent = () => {
    switch (widgetId) {
      case 'kpi':
        return renderKPIContent();
      case 'alerts':
        return renderAlertsContent();
      case 'todo':
        return renderTodoContent();
      case 'projectsSnap':
        return renderProjectsSnapContent();
      case 'reception':
        return renderReceptionContent();
      case 'booking':
        return renderBookingContent();
      case 'ledgerActions':
        return renderLedgerActionsContent();
      case 'accountingPanel':
        return renderAccountingPanelContent();
      case 'marketingPanel':
        return renderMarketingPanelContent();
      case 'aftercareFlow':
        return renderAftercareFlowContent();
      case 'ragToggle':
        return renderRAGToggleContent();
      default:
        return <p className="text-gray-500">ウィジェット準備中...</p>;
    }
  };

  // KPIウィジェット
  const renderKPIContent = () => {
    const mockStats = {
      value: '¥12,450,000',
      change: '+12.5%',
      subtitle: '前月比',
    };

    return (
      <div className="space-y-2">
        <div className="text-2xl font-bold">{mockStats.value}</div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            {mockStats.change}
          </Badge>
          <span className="text-sm text-gray-500">{mockStats.subtitle}</span>
        </div>
      </div>
    );
  };

  // アラートウィジェット
  const renderAlertsContent = () => {
    const mockAlerts = [
      { id: 1, message: '予算超過の案件があります', level: 'warning' },
      { id: 2, message: '承認待ちの見積書があります', level: 'info' },
    ];

    return (
      <div className="space-y-2">
        {mockAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-2 rounded text-sm ${
              alert.level === 'warning'
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            {alert.message}
          </div>
        ))}
      </div>
    );
  };

  // 案件スナップウィジェット
  const renderProjectsSnapContent = () => {
    const mockProjects = [
      { name: '田中様邸', progress: 75, status: '順調' },
      { name: '山田ビル', progress: 45, status: '遅延' },
      { name: '佐藤邸', progress: 90, status: '完了間近' },
    ];

    return (
      <div className="space-y-3">
        {mockProjects.map((project, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{project.name}</span>
              <Badge variant={project.status === '遅延' ? 'destructive' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        ))}
      </div>
    );
  };

  // 受付カウンターウィジェット
  const renderReceptionContent = () => {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" className="bg-blue-600">来客受付</Button>
          <Button size="sm" variant="outline">配送確認</Button>
        </div>
        <div className="text-sm space-y-1">
          <p>・現在の来客: 2名</p>
          <p>・待ち時間: 約5分</p>
        </div>
      </div>
    );
  };

  // 予約状況ウィジェット
  const renderBookingContent = () => {
    const mockBookings = [
      { time: '10:00', room: '商談室A', customer: '田中様' },
      { time: '14:00', room: '商談室B', customer: '山田様' },
    ];

    return (
      <div className="space-y-2">
        {mockBookings.map((booking, index) => (
          <div key={index} className="p-2 border rounded">
            <div className="flex justify-between items-center">
              <span className="font-medium">{booking.time}</span>
              <Badge variant="outline">{booking.room}</Badge>
            </div>
            <p className="text-sm text-gray-600">{booking.customer}</p>
          </div>
        ))}
      </div>
    );
  };

  // 台帳操作ウィジェット（施工管理）
  const renderLedgerActionsContent = () => {
    const actions = [
      { key: 'E', label: '出来高入力', color: 'blue' },
      { key: 'C', label: '変更工事起票', color: 'orange' },
      { key: 'B', label: '請求案作成', color: 'green' },
    ];

    return (
      <div className="grid grid-cols-1 gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            className={`h-12 ${
              action.color === 'blue'
                ? 'bg-blue-600 hover:bg-blue-700'
                : action.color === 'orange'
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
            onClick={() => onAction?.('shortcut', { key: action.key, action })}
          >
            <span className="font-bold mr-2">{action.key}</span>
            {action.label}
          </Button>
        ))}
      </div>
    );
  };

  // 経理パネルウィジェット
  const renderAccountingPanelContent = () => {
    const mockData = {
      pending: '¥2,450,000',
      overdue: '¥340,000',
      collected: '¥8,700,000',
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between">
            <span>請求中:</span>
            <span className="font-medium">{mockData.pending}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>督促対象:</span>
            <span className="font-medium">{mockData.overdue}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>今月回収:</span>
            <span className="font-medium">{mockData.collected}</span>
          </div>
        </div>
      </div>
    );
  };

  // マーケティングパネルウィジェット
  const renderMarketingPanelContent = () => {
    const mockData = {
      cpa: '¥12,500',
      conversion: '3.2%',
      leads: '48件',
    };

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex justify-between">
            <span>CPA:</span>
            <span className="font-medium">{mockData.cpa}</span>
          </div>
          <div className="flex justify-between">
            <span>CV率:</span>
            <span className="font-medium">{mockData.conversion}</span>
          </div>
          <div className="flex justify-between">
            <span>リード:</span>
            <span className="font-medium">{mockData.leads}</span>
          </div>
        </div>
      </div>
    );
  };

  // アフターケアフローウィジェット
  const renderAftercareFlowContent = () => {
    const mockFlow = [
      { step: '点検実施', count: 5, status: 'active' },
      { step: '是正見積', count: 2, status: 'pending' },
      { step: '台帳合流', count: 1, status: 'waiting' },
    ];

    return (
      <div className="space-y-2">
        {mockFlow.map((item, index) => (
          <div key={index} className="flex justify-between items-center p-2 border rounded">
            <span className="text-sm">{item.step}</span>
            <Badge variant={
              item.status === 'active' ? 'default' :
              item.status === 'pending' ? 'secondary' : 'outline'
            }>
              {item.count}件
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  // RAGトグルウィジェット
  const renderRAGToggleContent = () => {
    return (
      <div className="text-center">
        <Button
          onClick={() => onAction?.('toggle-rag')}
          className="w-full"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          RAG検索を開く
        </Button>
        <p className="text-xs text-gray-500 mt-2">Rキーでトグル</p>
      </div>
    );
  };

  // Todoコンテンツ（再利用）
  const renderTodoContent = () => {
    const mockTodos = [
      { id: 1, title: '見積書承認待ち', priority: 'high', status: 'overdue' },
      { id: 2, title: '安全点検実施', priority: 'medium', status: 'due_soon' },
      { id: 3, title: '資材発注確認', priority: 'high', status: 'normal' },
    ];

    return (
      <div className="space-y-2">
        {mockTodos.map((todo) => (
          <div
            key={todo.id}
            className={`p-3 rounded border cursor-pointer hover:bg-gray-50 ${
              todo.status === 'overdue'
                ? 'border-red-200 bg-red-50'
                : todo.status === 'due_soon'
                ? 'border-amber-200 bg-amber-50'
                : 'border-gray-200'
            }`}
            onClick={() => onAction?.('todo-click', todo)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{todo.title}</span>
              <Badge
                variant={todo.priority === 'high' ? 'destructive' : 'secondary'}
              >
                {todo.priority === 'high' ? '高' : '中'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="col-span-1 md:col-span-2 hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          {getIcon(widgetId)}
          <span>{getTitle(widgetId)}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{renderContent()}</CardContent>
    </Card>
  );
}