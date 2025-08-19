'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  FileText,
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  Users,
  UserCheck,
  AlertCircle,
  Settings,
  Save,
  X,
  DollarSign,
  ShoppingCart,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface ApprovalStep {
  id: string;
  order: number;
  approverRole: string;
  approverName?: string;
  condition?: string;
  isOptional: boolean;
}

interface ApprovalFlow {
  id: string;
  name: string;
  type: 'estimate' | 'order' | 'expense';
  description: string;
  steps: ApprovalStep[];
  isActive: boolean;
  updatedAt: string;
}

export default function ApprovalFlowsManagement() {
  const router = useRouter();
  const { user, isLoading, isSuperAdmin } = useAuth();
  const [selectedFlowType, setSelectedFlowType] = useState<string>('estimate');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFlow, setEditingFlow] = useState<ApprovalFlow | null>(null);

  // モックデータ：承認フロー
  const [approvalFlows] = useState<ApprovalFlow[]>([
    {
      id: '1',
      name: '標準見積承認フロー',
      type: 'estimate',
      description: '100万円以上の見積書の承認フロー',
      steps: [
        {
          id: '1-1',
          order: 1,
          approverRole: '営業担当',
          approverName: '作成者',
          isOptional: false,
        },
        {
          id: '1-2',
          order: 2,
          approverRole: '支店長',
          approverName: '支店長',
          condition: '100万円以上',
          isOptional: false,
        },
        {
          id: '1-3',
          order: 3,
          approverRole: '経営者',
          approverName: '経営者',
          condition: '500万円以上',
          isOptional: false,
        },
      ],
      isActive: true,
      updatedAt: '2024-03-15',
    },
    {
      id: '2',
      name: '簡易見積承認フロー',
      type: 'estimate',
      description: '100万円未満の見積書の承認フロー',
      steps: [
        {
          id: '2-1',
          order: 1,
          approverRole: '営業担当',
          approverName: '作成者',
          isOptional: false,
        },
        {
          id: '2-2',
          order: 2,
          approverRole: '支店長',
          approverName: '支店長',
          isOptional: true,
        },
      ],
      isActive: true,
      updatedAt: '2024-03-14',
    },
    {
      id: '3',
      name: '発注承認フロー',
      type: 'order',
      description: '資材・外注発注の承認フロー',
      steps: [
        {
          id: '3-1',
          order: 1,
          approverRole: '施工管理',
          approverName: '担当者',
          isOptional: false,
        },
        {
          id: '3-2',
          order: 2,
          approverRole: '支店長',
          approverName: '支店長',
          condition: '50万円以上',
          isOptional: false,
        },
      ],
      isActive: true,
      updatedAt: '2024-03-13',
    },
    {
      id: '4',
      name: '経費申請承認フロー',
      type: 'expense',
      description: '経費精算の承認フロー',
      steps: [
        {
          id: '4-1',
          order: 1,
          approverRole: '申請者',
          approverName: '申請者',
          isOptional: false,
        },
        {
          id: '4-2',
          order: 2,
          approverRole: '経理担当',
          approverName: '経理担当者',
          isOptional: false,
        },
        {
          id: '4-3',
          order: 3,
          approverRole: '支店長',
          approverName: '支店長',
          condition: '10万円以上',
          isOptional: false,
        },
      ],
      isActive: true,
      updatedAt: '2024-03-12',
    },
  ]);

  const flowTypes = [
    {
      id: 'estimate',
      name: '見積承認',
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
      description: '見積書の承認ルート',
    },
    {
      id: 'order',
      name: '発注承認',
      icon: ShoppingCart,
      color: 'from-green-500 to-emerald-500',
      description: '発注書の承認ルート',
    },
    {
      id: 'expense',
      name: '経費承認',
      icon: CreditCard,
      color: 'from-purple-500 to-pink-500',
      description: '経費申請の承認ルート',
    },
  ];

  const roles = [
    '経営者',
    '支店長',
    '営業担当',
    '経理担当',
    '施工管理',
    '事務員',
    '申請者',
    '作成者',
  ];

  useEffect(() => {
    if (!isLoading && !isSuperAdmin()) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isSuperAdmin, router]);

  const filteredFlows = approvalFlows.filter(
    (flow) => flow.type === selectedFlowType,
  );

  const handleDeleteFlow = (flowId: string) => {
    if (confirm('この承認フローを削除してもよろしいですか？')) {
      console.log('Delete flow:', flowId);
    }
  };

  const getStatusIcon = (isActive: boolean) => {
    if (isActive) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-gray-400" />;
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <nav className="bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="hover:bg-white/20 p-2 rounded transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="h-7 w-7" />
                  承認フロー設定
                </h1>
                <p className="text-sm opacity-90 mt-1">
                  見積・発注・経費の承認ルート管理
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus className="h-5 w-5" />
              新規フロー作成
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* フロータイプ選択タブ */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex overflow-x-auto">
            {flowTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedFlowType(type.id)}
                className={`flex-1 px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  selectedFlowType === type.id
                    ? 'border-red-500 text-red-600 bg-red-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <type.icon className="h-5 w-5" />
                  <span>{type.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 承認フロー一覧 */}
        <div className="space-y-4">
          {filteredFlows.map((flow) => (
            <div key={flow.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">
                      {flow.name}
                    </h3>
                    {getStatusIcon(flow.isActive)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {flow.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    最終更新: {flow.updatedAt}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingFlow(flow);
                      setShowEditModal(true);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteFlow(flow.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <Trash2 className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* 承認ステップ */}
              <div className="flex items-center gap-2 overflow-x-auto">
                {flow.steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className="bg-gray-50 rounded-lg p-3 min-w-[150px]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          STEP {step.order}
                        </span>
                        {step.isOptional && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                            任意
                          </span>
                        )}
                      </div>
                      <div className="font-medium text-sm text-gray-900">
                        {step.approverRole}
                      </div>
                      {step.condition && (
                        <div className="text-xs text-gray-600 mt-1">
                          条件: {step.condition}
                        </div>
                      )}
                    </div>
                    {index < flow.steps.length - 1 && (
                      <ArrowRight className="h-5 w-5 text-gray-400 mx-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 空の状態 */}
        {filteredFlows.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              承認フローが設定されていません
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              新規フロー作成ボタンから承認フローを追加してください
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              新規フロー作成
            </button>
          </div>
        )}
      </div>

      {/* 新規作成モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">新規承認フロー作成</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    フロー名
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="例: 大型案件見積承認フロー"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    フロータイプ
                  </label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                    <option value="estimate">見積承認</option>
                    <option value="order">発注承認</option>
                    <option value="expense">経費承認</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={2}
                    placeholder="このフローの用途や条件を記載"
                  />
                </div>

                {/* 承認ステップ設定 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      承認ステップ
                    </label>
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      ステップ追加
                    </button>
                  </div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm">
                            STEP {step}
                          </span>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              承認者
                            </label>
                            <select className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-red-500">
                              <option value="">選択してください</option>
                              {roles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              条件（任意）
                            </label>
                            <input
                              type="text"
                              className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-red-500"
                              placeholder="例: 100万円以上"
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm text-gray-700">
                              任意承認
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveNew"
                    className="rounded"
                    defaultChecked
                  />
                  <label
                    htmlFor="isActiveNew"
                    className="text-sm text-gray-700"
                  >
                    このフローを有効にする
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    フローを作成
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showEditModal && editingFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">承認フロー編集</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingFlow(null);
                  }}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    フロー名
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={editingFlow.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    defaultValue={editingFlow.description}
                  />
                </div>

                {/* 承認ステップ編集 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      承認ステップ
                    </label>
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      ステップ追加
                    </button>
                  </div>
                  <div className="space-y-3">
                    {editingFlow.steps.map((step) => (
                      <div key={step.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-sm">
                            STEP {step.order}
                          </span>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              承認者
                            </label>
                            <select
                              className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                              defaultValue={step.approverRole}
                            >
                              {roles.map((role) => (
                                <option key={role} value={role}>
                                  {role}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              条件（任意）
                            </label>
                            <input
                              type="text"
                              className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                              defaultValue={step.condition}
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="rounded"
                              defaultChecked={step.isOptional}
                            />
                            <span className="text-sm text-gray-700">
                              任意承認
                            </span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    className="rounded"
                    defaultChecked={editingFlow.isActive}
                  />
                  <label
                    htmlFor="isActiveEdit"
                    className="text-sm text-gray-700"
                  >
                    このフローを有効にする
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingFlow(null);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    変更を保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
