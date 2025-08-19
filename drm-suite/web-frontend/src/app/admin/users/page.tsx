'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  UserCheck,
  UserX,
  Filter,
  Download,
  Upload,
  Mail,
  Shield,
  Key,
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
}

export default function UsersManagement() {
  const router = useRouter();
  const { user, isLoading, isSuperAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // モックデータ
  const [users] = useState<User[]>([
    {
      id: '1',
      name: '山田 太郎',
      email: 'yamada@drm.com',
      role: '経営者',
      department: '経営管理',
      isActive: true,
      lastLogin: '2024-03-15 09:30',
      createdAt: '2023-01-10',
    },
    {
      id: '2',
      name: '鈴木 一郎',
      email: 'suzuki@drm.com',
      role: '支店長',
      department: '東京支店',
      isActive: true,
      lastLogin: '2024-03-15 08:45',
      createdAt: '2023-02-15',
    },
    {
      id: '3',
      name: '佐藤 次郎',
      email: 'sato@drm.com',
      role: '営業担当',
      department: '営業部',
      isActive: true,
      lastLogin: '2024-03-14 18:20',
      createdAt: '2023-03-20',
    },
    {
      id: '4',
      name: '山田 愛子',
      email: 'aiko@drm.com',
      role: '経理担当',
      department: '経理部',
      isActive: true,
      lastLogin: '2024-03-15 10:15',
      createdAt: '2023-04-01',
    },
    {
      id: '5',
      name: '木村 健太',
      email: 'kimura@drm.com',
      role: 'マーケティング',
      department: 'マーケティング部',
      isActive: false,
      lastLogin: '2024-03-10 14:30',
      createdAt: '2023-05-15',
    },
    {
      id: '6',
      name: '田中 三郎',
      email: 'tanaka@drm.com',
      role: '施工管理',
      department: '施工部',
      isActive: true,
      lastLogin: '2024-03-15 07:00',
      createdAt: '2023-06-01',
    },
    {
      id: '7',
      name: '高橋 花子',
      email: 'takahashi@drm.com',
      role: '事務員',
      department: '事務部',
      isActive: true,
      lastLogin: '2024-03-15 09:00',
      createdAt: '2023-07-10',
    },
    {
      id: '8',
      name: '中村 次郎',
      email: 'nakamura@drm.com',
      role: 'アフター担当',
      department: 'アフターサービス部',
      isActive: true,
      lastLogin: '2024-03-14 16:45',
      createdAt: '2023-08-20',
    },
  ]);

  const roles = [
    '経営者',
    '支店長',
    '営業担当',
    '経理担当',
    'マーケティング',
    '施工管理',
    '事務員',
    'アフター担当',
  ];

  useEffect(() => {
    if (!isLoading && !isSuperAdmin()) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isSuperAdmin, router]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleToggleActive = (userId: string) => {
    // 実際の実装では、APIを呼び出してユーザーのアクティブ状態を切り替え
    console.log('Toggle active for user:', userId);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('このユーザーを削除してもよろしいですか？')) {
      // 実際の実装では、APIを呼び出してユーザーを削除
      console.log('Delete user:', userId);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedUsers.length === 0) {
      alert('ユーザーを選択してください');
      return;
    }
    console.log(`Bulk action: ${action} for users:`, selectedUsers);
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
                  <Users className="h-7 w-7" />
                  ユーザー管理
                </h1>
                <p className="text-sm opacity-90 mt-1">
                  総ユーザー数: {users.length}名 / アクティブ:{' '}
                  {users.filter((u) => u.isActive).length}名
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus className="h-5 w-5" />
              新規ユーザー追加
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 検索・フィルター */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="名前またはメールアドレスで検索..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">全ての役職</option>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Filter className="h-4 w-4" />
                詳細フィルター
              </button>
            </div>
          </div>

          {/* 一括操作 */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-blue-700">
                {selectedUsers.length}名のユーザーを選択中
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition"
                >
                  一括有効化
                </button>
                <button
                  onClick={() => handleBulkAction('deactivate')}
                  className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition"
                >
                  一括無効化
                </button>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
                >
                  一括削除
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ユーザーリスト */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      className="rounded"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredUsers.map((u) => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    役職
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    部署
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    最終ログイン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(
                              selectedUsers.filter((id) => id !== user.id),
                            );
                          }
                        }}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.department}
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                          <UserCheck className="h-3 w-3" />
                          有効
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 flex items-center gap-1 w-fit">
                          <UserX className="h-3 w-3" />
                          無効
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id)}
                          className="text-yellow-600 hover:text-yellow-800 transition"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ツールバー */}
        <div className="mt-6 flex justify-between items-center">
          <div className="flex gap-2">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="h-4 w-4" />
              エクスポート
            </button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Upload className="h-4 w-4" />
              インポート
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {filteredUsers.length}件中 {filteredUsers.length}件を表示
            </span>
          </div>
        </div>
      </div>

      {/* ユーザー追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">新規ユーザー追加</h2>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      氏名
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="山田 太郎"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="example@company.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      役職
                    </label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                      <option value="">選択してください</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      部署
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="営業部"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    初期パスワード
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="8文字以上の安全なパスワード"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="sendEmail" className="rounded" />
                  <label htmlFor="sendEmail" className="text-sm text-gray-700">
                    ユーザーに招待メールを送信する
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
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    ユーザーを追加
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ユーザー編集モーダル */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">ユーザー編集</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                  }}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      氏名
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingUser.name}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingUser.email}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      役職
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingUser.role}
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      部署
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingUser.department}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ステータス
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    defaultValue={editingUser.isActive ? 'active' : 'inactive'}
                  >
                    <option value="active">有効</option>
                    <option value="inactive">無効</option>
                  </select>
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    パスワードリセット
                  </h3>
                  <button
                    type="button"
                    className="px-4 py-2 border border-yellow-500 text-yellow-600 rounded-lg hover:bg-yellow-50 flex items-center gap-2"
                  >
                    <Key className="h-4 w-4" />
                    パスワードリセットリンクを送信
                  </button>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingUser(null);
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
