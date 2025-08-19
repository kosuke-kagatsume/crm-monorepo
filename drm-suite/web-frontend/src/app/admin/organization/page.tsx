'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Plus,
  Edit2,
  Trash2,
  Users,
  UserPlus,
  Move,
  Save,
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  parentId: string | null;
  managerId: string | null;
  managerName: string | null;
  memberCount: number;
  children: Department[];
}

export default function OrganizationManagement() {
  const router = useRouter();
  const { user, isLoading, isSuperAdmin } = useAuth();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // モックデータ：組織構造
  const [organization] = useState<Department>({
    id: 'root',
    name: 'デモ建設株式会社',
    parentId: null,
    managerId: '1',
    managerName: '山田 太郎',
    memberCount: 42,
    children: [
      {
        id: 'tokyo',
        name: '東京支店',
        parentId: 'root',
        managerId: '2',
        managerName: '鈴木 一郎',
        memberCount: 15,
        children: [
          {
            id: 'tokyo-sales',
            name: '営業部',
            parentId: 'tokyo',
            managerId: '3',
            managerName: '佐藤 次郎',
            memberCount: 5,
            children: [],
          },
          {
            id: 'tokyo-construction',
            name: '施工部',
            parentId: 'tokyo',
            managerId: '6',
            managerName: '田中 三郎',
            memberCount: 8,
            children: [],
          },
          {
            id: 'tokyo-office',
            name: '事務部',
            parentId: 'tokyo',
            managerId: '7',
            managerName: '高橋 花子',
            memberCount: 2,
            children: [],
          },
        ],
      },
      {
        id: 'osaka',
        name: '大阪支店',
        parentId: 'root',
        managerId: null,
        managerName: null,
        memberCount: 12,
        children: [
          {
            id: 'osaka-sales',
            name: '営業部',
            parentId: 'osaka',
            managerId: null,
            managerName: null,
            memberCount: 4,
            children: [],
          },
          {
            id: 'osaka-construction',
            name: '施工部',
            parentId: 'osaka',
            managerId: null,
            managerName: null,
            memberCount: 6,
            children: [],
          },
          {
            id: 'osaka-office',
            name: '事務部',
            parentId: 'osaka',
            managerId: null,
            managerName: null,
            memberCount: 2,
            children: [],
          },
        ],
      },
      {
        id: 'admin',
        name: '管理本部',
        parentId: 'root',
        managerId: null,
        managerName: null,
        memberCount: 15,
        children: [
          {
            id: 'accounting',
            name: '経理部',
            parentId: 'admin',
            managerId: '4',
            managerName: '山田 愛子',
            memberCount: 3,
            children: [],
          },
          {
            id: 'marketing',
            name: 'マーケティング部',
            parentId: 'admin',
            managerId: '5',
            managerName: '木村 健太',
            memberCount: 4,
            children: [],
          },
          {
            id: 'aftercare',
            name: 'アフターサービス部',
            parentId: 'admin',
            managerId: '8',
            managerName: '中村 次郎',
            memberCount: 3,
            children: [],
          },
          {
            id: 'hr',
            name: '人事部',
            parentId: 'admin',
            managerId: null,
            managerName: null,
            memberCount: 2,
            children: [],
          },
          {
            id: 'it',
            name: 'IT部',
            parentId: 'admin',
            managerId: null,
            managerName: null,
            memberCount: 3,
            children: [],
          },
        ],
      },
    ],
  });

  useEffect(() => {
    if (!isLoading && !isSuperAdmin()) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isSuperAdmin, router]);

  const toggleExpand = (deptId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
      } else {
        newSet.add(deptId);
      }
      return newSet;
    });
  };

  const handleAddDepartment = (parentDept: Department) => {
    setEditingDept(parentDept);
    setShowAddModal(true);
  };

  const handleEditDepartment = (dept: Department) => {
    setEditingDept(dept);
    setShowEditModal(true);
  };

  const handleDeleteDepartment = (dept: Department) => {
    if (dept.children.length > 0) {
      alert('下位部署が存在するため削除できません');
      return;
    }
    if (confirm(`${dept.name}を削除してもよろしいですか？`)) {
      console.log('Delete department:', dept);
    }
  };

  const DepartmentNode = ({
    dept,
    level = 0,
  }: {
    dept: Department;
    level?: number;
  }) => {
    const isExpanded = expandedNodes.has(dept.id);
    const hasChildren = dept.children.length > 0;

    return (
      <div>
        <div
          className={`flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors ${
            selectedDept?.id === dept.id ? 'bg-blue-50' : ''
          }`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => setSelectedDept(dept)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(dept.id);
            }}
            className="mr-2"
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )
            ) : (
              <div className="w-4" />
            )}
          </button>
          <Building2 className="h-5 w-5 text-gray-400 mr-2" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-gray-900">{dept.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({dept.memberCount}名)
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddDepartment(dept);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Plus className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditDepartment(dept);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Edit2 className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDepartment(dept);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <Trash2 className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
            {dept.managerName && (
              <div className="text-sm text-gray-500">
                責任者: {dept.managerName}
              </div>
            )}
          </div>
        </div>
        {isExpanded &&
          dept.children.map((child) => (
            <DepartmentNode key={child.id} dept={child} level={level + 1} />
          ))}
      </div>
    );
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
                  <Building2 className="h-7 w-7" />
                  組織構造管理
                </h1>
                <p className="text-sm opacity-90 mt-1">部署と階層の管理</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus className="h-5 w-5" />
              部署を追加
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 組織ツリー */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">組織図</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpandedNodes(new Set())}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    すべて折りたたむ
                  </button>
                  <button
                    onClick={() => {
                      const allIds = new Set<string>();
                      const collectIds = (dept: Department) => {
                        allIds.add(dept.id);
                        dept.children.forEach(collectIds);
                      };
                      collectIds(organization);
                      setExpandedNodes(allIds);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    すべて展開
                  </button>
                </div>
              </div>
              <div className="border rounded-lg p-4">
                <DepartmentNode dept={organization} />
              </div>
            </div>
          </div>

          {/* 部署詳細 */}
          <div className="lg:col-span-1">
            {selectedDept ? (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  部署詳細
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">部署名</p>
                    <p className="font-medium text-gray-900">
                      {selectedDept.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">責任者</p>
                    <p className="font-medium text-gray-900">
                      {selectedDept.managerName || '未設定'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">所属人数</p>
                    <p className="font-medium text-gray-900">
                      {selectedDept.memberCount}名
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">下位部署数</p>
                    <p className="font-medium text-gray-900">
                      {selectedDept.children.length}部署
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                    <Users className="h-4 w-4" />
                    メンバー一覧
                  </button>
                  <button className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    メンバーを追加
                  </button>
                  <button className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2">
                    <Move className="h-4 w-4" />
                    部署を移動
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-gray-500 text-center">
                  部署を選択してください
                </p>
              </div>
            )}

            {/* 統計情報 */}
            <div className="mt-6 bg-white rounded-xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">組織統計</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">総部署数</span>
                  <span className="font-medium text-gray-900">11部署</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">総従業員数</span>
                  <span className="font-medium text-gray-900">42名</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">最大階層</span>
                  <span className="font-medium text-gray-900">3階層</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">平均部署人数</span>
                  <span className="font-medium text-gray-900">3.8名</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 部署追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">部署を追加</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    部署名
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="新規部署名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    親部署
                  </label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">デモ建設株式会社</option>
                    <option value="tokyo">東京支店</option>
                    <option value="osaka">大阪支店</option>
                    <option value="admin">管理本部</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    責任者
                  </label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                    <option value="">選択してください</option>
                    <option value="1">山田 太郎</option>
                    <option value="2">鈴木 一郎</option>
                    <option value="3">佐藤 次郎</option>
                  </select>
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
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    部署を追加
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 部署編集モーダル */}
      {showEditModal && editingDept && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">部署を編集</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingDept(null);
                  }}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    部署名
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={editingDept.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    責任者
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={editingDept.managerId || ''}
                  >
                    <option value="">選択してください</option>
                    <option value="1">山田 太郎</option>
                    <option value="2">鈴木 一郎</option>
                    <option value="3">佐藤 次郎</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingDept(null);
                    }}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
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
