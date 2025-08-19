'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Database,
  ChevronLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  Upload,
  Package,
  Tag,
  Calculator,
  Wrench,
  Home,
  Users,
  FileText,
  Save,
  X,
} from 'lucide-react';

interface MasterItem {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number;
  taxRate: number;
  description?: string;
  isActive: boolean;
  updatedAt: string;
}

interface MasterCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  count: number;
  path: string;
}

export default function MastersManagement() {
  const router = useRouter();
  const { user, isLoading, isSuperAdmin } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);

  // マスタカテゴリー
  const masterCategories: MasterCategory[] = [
    {
      id: 'products',
      name: '商品マスタ',
      description: '建材・資材の商品情報',
      icon: Package,
      color: 'from-blue-500 to-cyan-500',
      count: 1250,
      path: '/admin/masters/products',
    },
    {
      id: 'items',
      name: '項目マスタ',
      description: '見積項目のテンプレート',
      icon: Tag,
      color: 'from-green-500 to-emerald-500',
      count: 350,
      path: '/admin/masters/items',
    },
    {
      id: 'prices',
      name: '単価マスタ',
      description: '標準単価と割引率',
      icon: Calculator,
      color: 'from-purple-500 to-pink-500',
      count: 850,
      path: '/admin/masters/prices',
    },
    {
      id: 'construction',
      name: '工事種別マスタ',
      description: '工事の種類と分類',
      icon: Wrench,
      color: 'from-orange-500 to-red-500',
      count: 45,
      path: '/admin/masters/construction',
    },
    {
      id: 'rooms',
      name: '部屋種別マスタ',
      description: '部屋の種類と仕様',
      icon: Home,
      color: 'from-indigo-500 to-purple-500',
      count: 28,
      path: '/admin/masters/rooms',
    },
    {
      id: 'partners',
      name: '協力会社マスタ',
      description: '協力会社と職人情報',
      icon: Users,
      color: 'from-teal-500 to-green-500',
      count: 156,
      path: '/admin/masters/partners',
    },
  ];

  // モックデータ：商品マスタ
  const [masterItems] = useState<MasterItem[]>([
    {
      id: '1',
      code: 'MAT-001',
      name: 'クロス（ビニール）標準',
      category: '内装材',
      unit: '㎡',
      basePrice: 1200,
      taxRate: 10,
      description: '一般的なビニールクロス',
      isActive: true,
      updatedAt: '2024-03-15',
    },
    {
      id: '2',
      code: 'MAT-002',
      name: 'フローリング材（標準）',
      category: '床材',
      unit: '㎡',
      basePrice: 3500,
      taxRate: 10,
      description: '標準グレードのフローリング材',
      isActive: true,
      updatedAt: '2024-03-14',
    },
    {
      id: '3',
      code: 'MAT-003',
      name: '石膏ボード 12.5mm',
      category: '下地材',
      unit: '枚',
      basePrice: 450,
      taxRate: 10,
      description: '標準的な石膏ボード',
      isActive: true,
      updatedAt: '2024-03-13',
    },
    {
      id: '4',
      code: 'EQP-001',
      name: 'システムキッチン I型 2550',
      category: '設備',
      unit: '台',
      basePrice: 450000,
      taxRate: 10,
      description: 'I型システムキッチン 標準仕様',
      isActive: true,
      updatedAt: '2024-03-12',
    },
    {
      id: '5',
      code: 'EQP-002',
      name: 'ユニットバス 1616',
      category: '設備',
      unit: '台',
      basePrice: 680000,
      taxRate: 10,
      description: '1616サイズ 標準仕様',
      isActive: true,
      updatedAt: '2024-03-11',
    },
    {
      id: '6',
      code: 'LAB-001',
      name: '大工工事（標準）',
      category: '労務',
      unit: '人日',
      basePrice: 25000,
      taxRate: 10,
      description: '大工工事標準単価',
      isActive: true,
      updatedAt: '2024-03-10',
    },
  ]);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin()) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isSuperAdmin, router]);

  const filteredItems = masterItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleDeleteItem = (itemId: string) => {
    if (confirm('このアイテムを削除してもよろしいですか？')) {
      console.log('Delete item:', itemId);
    }
  };

  const handleImport = () => {
    console.log('Import master data');
  };

  const handleExport = () => {
    console.log('Export master data');
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
                  <Database className="h-7 w-7" />
                  マスタ管理
                </h1>
                <p className="text-sm opacity-90 mt-1">
                  商品・項目・単価マスタの管理
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleImport}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Upload className="h-4 w-4" />
                インポート
              </button>
              <button
                onClick={handleExport}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                <Download className="h-4 w-4" />
                エクスポート
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* マスタカテゴリー一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {masterCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                if (category.path) {
                  router.push(category.path);
                } else {
                  setSelectedCategory(category.id);
                }
              }}
              className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 p-6 text-left ${
                selectedCategory === category.id ? 'ring-2 ring-red-500' : ''
              }`}
            >
              <div
                className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${category.color} mb-4`}
              >
                <category.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-1 flex items-center justify-between">
                {category.name}
                <span className="text-2xl font-bold text-gray-400">
                  {category.count}
                </span>
              </h3>
              <p className="text-sm text-gray-600">{category.description}</p>
            </button>
          ))}
        </div>

        {/* 選択されたマスタの詳細 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {masterCategories.find((c) => c.id === selectedCategory)?.name}
            </h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Plus className="h-5 w-5" />
              新規追加
            </button>
          </div>

          {/* 検索バー */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="商品名、コード、カテゴリーで検索..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* データテーブル */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    コード
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    名称
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    カテゴリー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    単位
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    基準単価
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    税率
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-sm text-gray-500">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{item.basePrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.taxRate}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          有効
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          無効
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
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
      </div>

      {/* 新規追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">新規マスタ追加</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      商品コード
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="MAT-XXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      商品名
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="商品名を入力"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリー
                    </label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                      <option value="">選択してください</option>
                      <option value="内装材">内装材</option>
                      <option value="床材">床材</option>
                      <option value="下地材">下地材</option>
                      <option value="設備">設備</option>
                      <option value="労務">労務</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      単位
                    </label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                      <option value="">選択してください</option>
                      <option value="㎡">㎡</option>
                      <option value="m">m</option>
                      <option value="枚">枚</option>
                      <option value="台">台</option>
                      <option value="式">式</option>
                      <option value="人日">人日</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      基準単価（税抜）
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      税率
                    </label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent">
                      <option value="10">10%</option>
                      <option value="8">8%（軽減税率）</option>
                      <option value="0">0%（非課税）</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="商品の説明を入力"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    className="rounded"
                    defaultChecked
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    有効にする
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
                    保存
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 編集モーダル */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">マスタ編集</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingItem(null);
                  }}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      商品コード
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingItem.code}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      商品名
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingItem.name}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      カテゴリー
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingItem.category}
                    >
                      <option value="内装材">内装材</option>
                      <option value="床材">床材</option>
                      <option value="下地材">下地材</option>
                      <option value="設備">設備</option>
                      <option value="労務">労務</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      単位
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingItem.unit}
                    >
                      <option value="㎡">㎡</option>
                      <option value="m">m</option>
                      <option value="枚">枚</option>
                      <option value="台">台</option>
                      <option value="式">式</option>
                      <option value="人日">人日</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      基準単価（税抜）
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingItem.basePrice}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      税率
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      defaultValue={editingItem.taxRate}
                    >
                      <option value="10">10%</option>
                      <option value="8">8%（軽減税率）</option>
                      <option value="0">0%（非課税）</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    説明
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    defaultValue={editingItem.description}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    className="rounded"
                    defaultChecked={editingItem.isActive}
                  />
                  <label
                    htmlFor="isActiveEdit"
                    className="text-sm text-gray-700"
                  >
                    有効にする
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingItem(null);
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
