'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Building2,
  Settings,
  Database,
  Shield,
  Activity,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  UserPlus,
  Key,
  FileText,
  Package,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading, isSuperAdmin, logout } = useAuth();

  useEffect(() => {
    // スーパー管理者でない場合はダッシュボードへリダイレクト
    if (!isLoading && !isSuperAdmin()) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isSuperAdmin, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin()) {
    return null;
  }

  // モックデータ
  const tenantStats = {
    totalUsers: 42,
    activeUsers: 38,
    departments: 5,
    dataUsage: '2.3GB',
    planType: 'Professional',
    contractEnd: '2025-12-31',
  };

  const quickActions = [
    {
      title: 'ユーザー管理',
      description: 'ユーザーの追加・編集・権限設定',
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      href: '/admin/users',
      count: tenantStats.totalUsers,
    },
    {
      title: '組織構造',
      description: '部署・階層の管理',
      icon: Building2,
      color: 'from-purple-500 to-pink-500',
      href: '/admin/organization',
      count: tenantStats.departments,
    },
    {
      title: '権限設定',
      description: '役職・権限マトリックス',
      icon: Shield,
      color: 'from-green-500 to-emerald-500',
      href: '/admin/permissions',
    },
    {
      title: 'マスタ管理',
      description: '商品・項目マスタ設定',
      icon: Database,
      color: 'from-orange-500 to-red-500',
      href: '/admin/masters',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <nav className="bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Shield className="h-7 w-7" />
                スーパー管理者コンソール
              </h1>
              <p className="text-sm opacity-90 mt-1">
                テナント: デモ建設株式会社 (ID: {user?.tenantId?.slice(0, 8)}
                ...)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition"
              >
                通常画面へ
              </button>
              <button
                onClick={logout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* テナント情報カード */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-red-500" />
            テナント概要
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">総ユーザー数</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenantStats.totalUsers}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">アクティブ</p>
              <p className="text-2xl font-bold text-green-600">
                {tenantStats.activeUsers}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">部署数</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenantStats.departments}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">データ使用量</p>
              <p className="text-2xl font-bold text-gray-900">
                {tenantStats.dataUsage}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">プラン</p>
              <p className="text-lg font-bold text-purple-600">
                {tenantStats.planType}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">契約期限</p>
              <p className="text-lg font-bold text-gray-900">
                {tenantStats.contractEnd}
              </p>
            </div>
          </div>
        </div>

        {/* クイックアクション */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">管理機能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => router.push(action.href)}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 text-left group"
            >
              <div
                className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${action.color} mb-4`}
              >
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1 flex items-center justify-between">
                {action.title}
                {action.count && (
                  <span className="text-2xl font-bold text-gray-400">
                    {action.count}
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 mb-2">{action.description}</p>
              <div className="flex items-center text-sm text-gray-500 group-hover:text-blue-600 transition-colors">
                管理画面へ
                <ChevronRight className="h-4 w-4 ml-1" />
              </div>
            </button>
          ))}
        </div>

        {/* その他の管理項目 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 承認フロー設定 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              承認フロー設定
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/admin/approval-flows')}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group"
              >
                <span>見積承認ルート</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </button>
              <button
                onClick={() => router.push('/admin/approval-flows')}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group"
              >
                <span>発注承認ルート</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </button>
              <button
                onClick={() => router.push('/admin/approval-flows')}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group"
              >
                <span>経費承認ルート</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>
          </div>

          {/* システム設定 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              システム設定
            </h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group">
                <span>通知設定</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group">
                <span>セキュリティ設定</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </button>
              <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center justify-between group">
                <span>バックアップ設定</span>
                <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
