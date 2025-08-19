'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, lazy, Suspense } from 'react';
import SalesDashboard from './sales';
import ManagerDashboard from './manager';
import ExecutiveDashboard from './executive';
import MarketingDashboard from './marketing';
import AccountingDashboard from './accounting';

// 動的インポートで施工管理、事務員、アフター担当のダッシュボードを読み込み
const ConstructionDashboard = lazy(() => import('./construction/page'));
const OfficeDashboard = lazy(() => import('./office/page'));
const AftercareDashboard = lazy(() => import('./aftercare/page'));

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [showEstimateModal, setShowEstimateModal] = useState(false);

  const getRoleMapping = (role: string) => {
    // Map Japanese role names to dashboard types
    if (role === '経営者') return 'executive';
    if (role === '支店長') return 'manager';
    if (role === '営業担当') return 'sales';
    if (role === '経理担当') return 'accounting';
    if (role === 'マーケティング') return 'marketing';
    if (role === '施工管理') return 'construction';
    if (role === '事務員') return 'office';
    if (role === 'アフター担当') return 'aftercare';
    // Return original if already in English format
    return role;
  };

  // リダイレクトを削除（同じページ内でコンポーネントを切り替える）
  useEffect(() => {
    // リダイレクト処理を削除
  }, []);

  const getRoleTitle = (role: string) => {
    const mappedRole = getRoleMapping(role);
    switch (mappedRole) {
      case 'sales':
        return '営業ダッシュボード';
      case 'manager':
        return '支店長ダッシュボード';
      case 'marketing':
        return 'マーケティングダッシュボード';
      case 'accounting':
        return '経理ダッシュボード';
      case 'executive':
        return '経営ダッシュボード';
      case 'construction':
        return '施工管理ダッシュボード';
      case 'office':
        return '事務ダッシュボード';
      case 'aftercare':
        return 'アフターサービスダッシュボード';
      default:
        return 'ダッシュボード';
    }
  };

  const getRoleColor = (role: string) => {
    const mappedRole = getRoleMapping(role);
    switch (mappedRole) {
      case 'sales':
        return 'from-dandori-orange to-dandori-yellow';
      case 'manager':
        return 'from-dandori-blue to-dandori-sky';
      case 'marketing':
        return 'from-dandori-yellow to-green-400';
      case 'accounting':
        return 'from-purple-500 to-dandori-pink';
      case 'executive':
        return 'from-dandori-blue to-dandori-sky';
      case 'construction':
        return 'from-orange-500 to-red-500';
      case 'office':
        return 'from-purple-500 to-pink-500';
      case 'aftercare':
        return 'from-cyan-500 to-blue-500';
      default:
        return 'from-gray-600 to-gray-700';
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dandori-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav
        className={`bg-gradient-to-r ${getRoleColor(user.role)} text-white shadow-lg`}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold whitespace-nowrap">
                {getRoleTitle(user.role)}
              </h1>
              <p className="text-sm opacity-90 mt-1">
                {new Date().toLocaleDateString('ja-JP', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {(getRoleMapping(user.role) === 'sales' ||
                getRoleMapping(user.role) === 'manager' ||
                getRoleMapping(user.role) === 'executive') && (
                <button
                  onClick={() => setShowEstimateModal(true)}
                  className="bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2 rounded transition text-sm sm:text-base whitespace-nowrap border border-white/30"
                >
                  <span className="mr-1 sm:mr-2">📝</span>
                  <span>見積作成</span>
                </button>
              )}
              <div className="text-right hidden md:block">
                <p className="text-sm opacity-90">ログイン中</p>
                <p className="font-medium text-sm">{user.email}</p>
              </div>
              <button
                onClick={logout}
                className="bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-2 rounded transition text-sm sm:text-base whitespace-nowrap"
              >
                <span className="hidden sm:inline">ログアウト</span>
                <span className="sm:hidden">ログアウト</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-full-hd mx-auto px-4 lg:px-6 xl:px-8 2xl:px-12 py-8">
        {getRoleMapping(user.role) === 'sales' && (
          <SalesDashboard userEmail={user.email} />
        )}
        {getRoleMapping(user.role) === 'manager' && (
          <ManagerDashboard userEmail={user.email} />
        )}
        {getRoleMapping(user.role) === 'executive' && (
          <ExecutiveDashboard userEmail={user.email} />
        )}
        {getRoleMapping(user.role) === 'marketing' && (
          <MarketingDashboard userEmail={user.email} />
        )}
        {getRoleMapping(user.role) === 'accounting' && (
          <AccountingDashboard userEmail={user.email} />
        )}
        {getRoleMapping(user.role) === 'construction' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dandori-blue"></div>
              </div>
            }
          >
            <ConstructionDashboard />
          </Suspense>
        )}
        {getRoleMapping(user.role) === 'office' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dandori-blue"></div>
              </div>
            }
          >
            <OfficeDashboard />
          </Suspense>
        )}
        {getRoleMapping(user.role) === 'aftercare' && (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dandori-blue"></div>
              </div>
            }
          >
            <AftercareDashboard />
          </Suspense>
        )}
      </div>

      {/* 見積作成選択モーダル */}
      {showEstimateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 overflow-hidden">
            <div className="bg-gradient-dandori text-white p-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">見積作成方法を選択</h2>
                <button
                  onClick={() => setShowEstimateModal(false)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 通常版 */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl blur-xl group-hover:blur-2xl opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
                  <button
                    onClick={() => {
                      setShowEstimateModal(false);
                      router.push('/estimates/create');
                    }}
                    className="relative w-full bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-dandori-blue hover:shadow-xl transition-all duration-300 text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white text-3xl shadow-lg">
                        📝
                      </div>
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                        スタンダード
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      通常版
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      シンプルで使いやすい標準的な見積作成フォーム
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">✓</span>
                        <span>基本的な項目入力</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">✓</span>
                        <span>テンプレート機能</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">✓</span>
                        <span>自動計算</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">✓</span>
                        <span>PDF出力</span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        作成時間: 約5分
                      </span>
                      <span className="text-dandori-blue font-bold">
                        選択 →
                      </span>
                    </div>
                  </button>
                </div>

                {/* プロ版 */}
                <div className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-2xl blur-xl group-hover:blur-2xl opacity-20 group-hover:opacity-30 transition-all duration-300"></div>
                  <button
                    onClick={() => {
                      setShowEstimateModal(false);
                      router.push('/estimates/create/enhanced');
                    }}
                    className="relative w-full bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-purple-500 hover:shadow-xl transition-all duration-300 text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white text-3xl shadow-lg">
                        🚀
                      </div>
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        プロフェッショナル
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      プロ版
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      建設業界特化の高機能見積作成システム
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2 text-purple-500">★</span>
                        <span>3階層の詳細分類</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2 text-purple-500">★</span>
                        <span>原価管理・利益分析</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2 text-purple-500">★</span>
                        <span>AIアシスタント</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2 text-purple-500">★</span>
                        <span>協力会社連携</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2 text-purple-500">★</span>
                        <span>画像・図面添付</span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        作成時間: 約10分
                      </span>
                      <span className="text-purple-600 font-bold">選択 →</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* 比較表 */}
              <div className="mt-8 p-6 bg-gray-50 rounded-xl">
                <h3 className="font-bold text-gray-900 mb-4">機能比較</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium text-gray-600">機能</div>
                  <div className="text-center font-medium text-blue-600">
                    通常版
                  </div>
                  <div className="text-center font-medium text-purple-600">
                    プロ版
                  </div>

                  <div className="py-2 border-t">基本情報入力</div>
                  <div className="py-2 border-t text-center">✓</div>
                  <div className="py-2 border-t text-center">✓</div>

                  <div className="py-2">テンプレート</div>
                  <div className="py-2 text-center">3種類</div>
                  <div className="py-2 text-center">10種類以上</div>

                  <div className="py-2">明細分類</div>
                  <div className="py-2 text-center">1階層</div>
                  <div className="py-2 text-center">3階層</div>

                  <div className="py-2">原価管理</div>
                  <div className="py-2 text-center">基本</div>
                  <div className="py-2 text-center">詳細</div>

                  <div className="py-2">AI支援</div>
                  <div className="py-2 text-center">-</div>
                  <div className="py-2 text-center">✓</div>

                  <div className="py-2">承認ワークフロー</div>
                  <div className="py-2 text-center">✓</div>
                  <div className="py-2 text-center">✓</div>

                  <div className="py-2">バージョン管理</div>
                  <div className="py-2 text-center">-</div>
                  <div className="py-2 text-center">✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
