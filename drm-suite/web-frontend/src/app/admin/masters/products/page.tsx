'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Package,
  ChevronLeft,
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  Upload,
  Filter,
  Save,
  X,
  Image,
  Copy,
  Eye,
  EyeOff,
} from 'lucide-react';
import { ProductMaster, ProductCategories, Units } from '@/types/master';

export default function ProductsMasterPage() {
  const router = useRouter();
  const { user, isLoading, isSuperAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterActive, setFilterActive] = useState<
    'all' | 'active' | 'inactive'
  >('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductMaster | null>(null);
  const [selectedItem, setSelectedItem] = useState<ProductMaster | null>(null);

  // モックデータ：商品マスタ
  const [products] = useState<ProductMaster[]>([
    {
      id: '1',
      code: 'MAT-001',
      name: 'クロス（ビニール）標準',
      category: '内装材',
      subCategory: '壁紙',
      unit: '㎡',
      basePrice: 1200,
      costPrice: 800,
      taxRate: 10,
      description: '一般的なビニールクロス',
      specifications: '幅90cm, 防火性能あり',
      maker: 'サンゲツ',
      modelNumber: 'RE-51234',
      stock: 500,
      leadTime: 3,
      isActive: true,
      createdAt: '2024-01-10',
      updatedAt: '2024-03-15',
    },
    {
      id: '2',
      code: 'MAT-002',
      name: 'フローリング材（標準）',
      category: '床材',
      subCategory: 'フローリング',
      unit: '㎡',
      basePrice: 3500,
      costPrice: 2500,
      taxRate: 10,
      description: '標準グレードのフローリング材',
      specifications: '厚さ12mm, 幅145mm',
      maker: '大建工業',
      modelNumber: 'WD-4521',
      stock: 200,
      leadTime: 7,
      isActive: true,
      createdAt: '2024-01-15',
      updatedAt: '2024-03-14',
    },
    {
      id: '3',
      code: 'MAT-003',
      name: '石膏ボード 12.5mm',
      category: '下地材',
      unit: '枚',
      basePrice: 450,
      costPrice: 320,
      taxRate: 10,
      description: '標準的な石膏ボード',
      specifications: '910×1820×12.5mm',
      maker: '吉野石膏',
      modelNumber: 'GB-R',
      stock: 1000,
      leadTime: 2,
      isActive: true,
      createdAt: '2024-01-20',
      updatedAt: '2024-03-13',
    },
    {
      id: '4',
      code: 'EQP-001',
      name: 'システムキッチン I型 2550',
      category: '設備',
      subCategory: 'キッチン',
      unit: '台',
      basePrice: 450000,
      costPrice: 320000,
      taxRate: 10,
      description: 'I型システムキッチン 標準仕様',
      specifications: 'W2550×D650×H850mm, IHクッキングヒーター付',
      maker: 'LIXIL',
      modelNumber: 'AS-255',
      stock: 0,
      leadTime: 21,
      isActive: true,
      createdAt: '2024-02-01',
      updatedAt: '2024-03-12',
    },
    {
      id: '5',
      code: 'EQP-002',
      name: 'ユニットバス 1616',
      category: '設備',
      subCategory: '浴室',
      unit: '台',
      basePrice: 680000,
      costPrice: 480000,
      taxRate: 10,
      description: '1616サイズ 標準仕様',
      specifications: '1600×1600×2000mm, 浴室換気乾燥機付',
      maker: 'TOTO',
      modelNumber: 'WY-1616',
      stock: 0,
      leadTime: 14,
      isActive: true,
      createdAt: '2024-02-05',
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
      createdAt: '2024-02-10',
      updatedAt: '2024-03-10',
    },
  ]);

  useEffect(() => {
    if (!isLoading && !isSuperAdmin()) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isSuperAdmin, router]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.maker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.modelNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || product.category === filterCategory;
    const matchesActive =
      filterActive === 'all' ||
      (filterActive === 'active' && product.isActive) ||
      (filterActive === 'inactive' && !product.isActive);
    return matchesSearch && matchesCategory && matchesActive;
  });

  const handleDelete = (id: string) => {
    if (confirm('この商品マスタを削除してもよろしいですか？')) {
      console.log('Delete product:', id);
    }
  };

  const handleDuplicate = (product: ProductMaster) => {
    const newProduct = {
      ...product,
      id: '',
      code: `${product.code}-COPY`,
      name: `${product.name}（コピー）`,
    };
    setEditingItem(newProduct);
    setShowAddModal(true);
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
                onClick={() => router.push('/admin/masters')}
                className="hover:bg-white/20 p-2 rounded transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Package className="h-7 w-7" />
                  商品マスタ
                </h1>
                <p className="text-sm opacity-90 mt-1">
                  建材・資材の商品情報管理
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition">
                <Upload className="h-4 w-4" />
                インポート
              </button>
              <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition">
                <Download className="h-4 w-4" />
                エクスポート
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
              >
                <Plus className="h-5 w-5" />
                新規追加
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* フィルター */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="商品名、コード、メーカー、型番で検索..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <select
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">全カテゴリー</option>
              {ProductCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
            >
              <option value="all">全ステータス</option>
              <option value="active">有効のみ</option>
              <option value="inactive">無効のみ</option>
            </select>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              詳細フィルター
            </button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">総商品数</p>
            <p className="text-2xl font-bold text-gray-900">
              {products.length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">有効商品</p>
            <p className="text-2xl font-bold text-green-600">
              {products.filter((p) => p.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">在庫あり</p>
            <p className="text-2xl font-bold text-blue-600">
              {products.filter((p) => (p.stock || 0) > 0).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">カテゴリー数</p>
            <p className="text-2xl font-bold text-purple-600">
              {new Set(products.map((p) => p.category)).size}
            </p>
          </div>
        </div>

        {/* データテーブル */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    コード
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    商品名
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
                    在庫
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
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.code}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        {product.maker && (
                          <div className="text-xs text-gray-500">
                            {product.maker}{' '}
                            {product.modelNumber && `/ ${product.modelNumber}`}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                        {product.category}
                      </span>
                      {product.subCategory && (
                        <span className="ml-1 text-xs text-gray-500">
                          / {product.subCategory}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ¥{product.basePrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {product.stock !== undefined ? (
                        <span
                          className={
                            product.stock > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {product.stock}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.isActive ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                          <Eye className="h-3 w-3" />
                          有効
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 flex items-center gap-1 w-fit">
                          <EyeOff className="h-3 w-3" />
                          無効
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedItem(product);
                            setShowDetailModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-800 transition p-1"
                          title="詳細"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(product);
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition p-1"
                          title="編集"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(product)}
                          className="text-green-600 hover:text-green-800 transition p-1"
                          title="複製"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-800 transition p-1"
                          title="削除"
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

      {/* 詳細モーダル */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">商品詳細</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedItem(null);
                  }}
                  className="text-white/80 hover:text-white text-2xl"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    商品コード
                  </label>
                  <p className="text-lg font-medium">{selectedItem.code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    商品名
                  </label>
                  <p className="text-lg font-medium">{selectedItem.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    カテゴリー
                  </label>
                  <p className="text-lg">
                    {selectedItem.category}
                    {selectedItem.subCategory &&
                      ` / ${selectedItem.subCategory}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    単位
                  </label>
                  <p className="text-lg">{selectedItem.unit}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    基準単価
                  </label>
                  <p className="text-lg font-medium">
                    ¥{selectedItem.basePrice.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    原価
                  </label>
                  <p className="text-lg">
                    {selectedItem.costPrice
                      ? `¥${selectedItem.costPrice.toLocaleString()}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    税率
                  </label>
                  <p className="text-lg">{selectedItem.taxRate}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    在庫数
                  </label>
                  <p className="text-lg">
                    {selectedItem.stock !== undefined
                      ? selectedItem.stock
                      : '-'}
                  </p>
                </div>
                {selectedItem.maker && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      メーカー
                    </label>
                    <p className="text-lg">{selectedItem.maker}</p>
                  </div>
                )}
                {selectedItem.modelNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      型番
                    </label>
                    <p className="text-lg">{selectedItem.modelNumber}</p>
                  </div>
                )}
                {selectedItem.leadTime !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      リードタイム
                    </label>
                    <p className="text-lg">{selectedItem.leadTime}日</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    ステータス
                  </label>
                  <p className="text-lg">
                    {selectedItem.isActive ? (
                      <span className="text-green-600">有効</span>
                    ) : (
                      <span className="text-gray-500">無効</span>
                    )}
                  </p>
                </div>
              </div>
              {selectedItem.description && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">
                    説明
                  </label>
                  <p className="text-gray-800 mt-1">
                    {selectedItem.description}
                  </p>
                </div>
              )}
              {selectedItem.specifications && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-gray-600">
                    仕様
                  </label>
                  <p className="text-gray-800 mt-1">
                    {selectedItem.specifications}
                  </p>
                </div>
              )}
              <div className="mt-6 flex justify-between text-sm text-gray-500">
                <span>作成日: {selectedItem.createdAt}</span>
                <span>更新日: {selectedItem.updatedAt}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
