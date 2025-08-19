'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Shield,
  ChevronLeft,
  Check,
  X,
  Eye,
  Edit,
  Trash,
  AlertCircle,
  Save,
  RefreshCw,
} from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermission {
  role: string;
  permissions: {
    [key: string]: 'full' | 'edit' | 'view' | 'none';
  };
}

export default function PermissionsManagement() {
  const router = useRouter();
  const { user, isLoading, isSuperAdmin } = useAuth();
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedRole, setSelectedRole] = useState('営業担当');

  // 権限カテゴリと項目
  const permissionCategories = [
    {
      name: '見積管理',
      permissions: [
        { id: 'estimate_view', name: '見積閲覧', description: '見積書の閲覧' },
        {
          id: 'estimate_create',
          name: '見積作成',
          description: '新規見積書の作成',
        },
        {
          id: 'estimate_edit',
          name: '見積編集',
          description: '既存見積書の編集',
        },
        {
          id: 'estimate_delete',
          name: '見積削除',
          description: '見積書の削除',
        },
        {
          id: 'estimate_approve',
          name: '見積承認',
          description: '見積書の承認',
        },
      ],
    },
    {
      name: '顧客管理',
      permissions: [
        {
          id: 'customer_view',
          name: '顧客閲覧',
          description: '顧客情報の閲覧',
        },
        {
          id: 'customer_create',
          name: '顧客追加',
          description: '新規顧客の追加',
        },
        {
          id: 'customer_edit',
          name: '顧客編集',
          description: '顧客情報の編集',
        },
        {
          id: 'customer_delete',
          name: '顧客削除',
          description: '顧客情報の削除',
        },
      ],
    },
    {
      name: '在庫管理',
      permissions: [
        {
          id: 'inventory_view',
          name: '在庫閲覧',
          description: '在庫情報の閲覧',
        },
        { id: 'inventory_edit', name: '在庫更新', description: '在庫数の更新' },
        { id: 'inventory_order', name: '発注管理', description: '商品の発注' },
      ],
    },
    {
      name: '経理管理',
      permissions: [
        {
          id: 'accounting_view',
          name: '経理閲覧',
          description: '経理情報の閲覧',
        },
        {
          id: 'accounting_invoice',
          name: '請求書発行',
          description: '請求書の作成・発行',
        },
        {
          id: 'accounting_payment',
          name: '入金管理',
          description: '入金情報の管理',
        },
        {
          id: 'accounting_report',
          name: '財務レポート',
          description: '財務レポートの閲覧',
        },
      ],
    },
    {
      name: 'レポート',
      permissions: [
        {
          id: 'report_sales',
          name: '売上レポート',
          description: '売上レポートの閲覧',
        },
        {
          id: 'report_performance',
          name: '業績レポート',
          description: '業績レポートの閲覧',
        },
        {
          id: 'report_export',
          name: 'データエクスポート',
          description: 'レポートデータの出力',
        },
      ],
    },
    {
      name: 'システム設定',
      permissions: [
        {
          id: 'settings_view',
          name: '設定閲覧',
          description: 'システム設定の閲覧',
        },
        {
          id: 'settings_edit',
          name: '設定変更',
          description: 'システム設定の変更',
        },
        {
          id: 'user_manage',
          name: 'ユーザー管理',
          description: 'ユーザーの追加・編集・削除',
        },
      ],
    },
  ];

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

  // デフォルトの権限設定
  const [rolePermissions, setRolePermissions] = useState<{
    [key: string]: { [key: string]: boolean };
  }>({
    経営者: {
      estimate_view: true,
      estimate_create: true,
      estimate_edit: true,
      estimate_delete: true,
      estimate_approve: true,
      customer_view: true,
      customer_create: true,
      customer_edit: true,
      customer_delete: true,
      inventory_view: true,
      inventory_edit: true,
      inventory_order: true,
      accounting_view: true,
      accounting_invoice: true,
      accounting_payment: true,
      accounting_report: true,
      report_sales: true,
      report_performance: true,
      report_export: true,
      settings_view: true,
      settings_edit: true,
      user_manage: true,
    },
    支店長: {
      estimate_view: true,
      estimate_create: true,
      estimate_edit: true,
      estimate_delete: false,
      estimate_approve: true,
      customer_view: true,
      customer_create: true,
      customer_edit: true,
      customer_delete: false,
      inventory_view: true,
      inventory_edit: true,
      inventory_order: false,
      accounting_view: true,
      accounting_invoice: false,
      accounting_payment: false,
      accounting_report: true,
      report_sales: true,
      report_performance: true,
      report_export: true,
      settings_view: true,
      settings_edit: false,
      user_manage: false,
    },
    営業担当: {
      estimate_view: true,
      estimate_create: true,
      estimate_edit: true,
      estimate_delete: false,
      estimate_approve: false,
      customer_view: true,
      customer_create: true,
      customer_edit: true,
      customer_delete: false,
      inventory_view: true,
      inventory_edit: false,
      inventory_order: false,
      accounting_view: false,
      accounting_invoice: false,
      accounting_payment: false,
      accounting_report: false,
      report_sales: true,
      report_performance: false,
      report_export: false,
      settings_view: false,
      settings_edit: false,
      user_manage: false,
    },
    経理担当: {
      estimate_view: true,
      estimate_create: false,
      estimate_edit: false,
      estimate_delete: false,
      estimate_approve: false,
      customer_view: true,
      customer_create: false,
      customer_edit: false,
      customer_delete: false,
      inventory_view: true,
      inventory_edit: false,
      inventory_order: false,
      accounting_view: true,
      accounting_invoice: true,
      accounting_payment: true,
      accounting_report: true,
      report_sales: true,
      report_performance: true,
      report_export: true,
      settings_view: false,
      settings_edit: false,
      user_manage: false,
    },
    マーケティング: {
      estimate_view: true,
      estimate_create: false,
      estimate_edit: false,
      estimate_delete: false,
      estimate_approve: false,
      customer_view: true,
      customer_create: true,
      customer_edit: true,
      customer_delete: false,
      inventory_view: true,
      inventory_edit: false,
      inventory_order: false,
      accounting_view: false,
      accounting_invoice: false,
      accounting_payment: false,
      accounting_report: false,
      report_sales: true,
      report_performance: true,
      report_export: true,
      settings_view: false,
      settings_edit: false,
      user_manage: false,
    },
    施工管理: {
      estimate_view: true,
      estimate_create: false,
      estimate_edit: false,
      estimate_delete: false,
      estimate_approve: false,
      customer_view: true,
      customer_create: false,
      customer_edit: false,
      customer_delete: false,
      inventory_view: true,
      inventory_edit: true,
      inventory_order: true,
      accounting_view: false,
      accounting_invoice: false,
      accounting_payment: false,
      accounting_report: false,
      report_sales: false,
      report_performance: false,
      report_export: false,
      settings_view: false,
      settings_edit: false,
      user_manage: false,
    },
    事務員: {
      estimate_view: true,
      estimate_create: true,
      estimate_edit: true,
      estimate_delete: false,
      estimate_approve: false,
      customer_view: true,
      customer_create: true,
      customer_edit: true,
      customer_delete: false,
      inventory_view: true,
      inventory_edit: false,
      inventory_order: false,
      accounting_view: true,
      accounting_invoice: true,
      accounting_payment: false,
      accounting_report: false,
      report_sales: false,
      report_performance: false,
      report_export: false,
      settings_view: false,
      settings_edit: false,
      user_manage: false,
    },
    アフター担当: {
      estimate_view: true,
      estimate_create: false,
      estimate_edit: false,
      estimate_delete: false,
      estimate_approve: false,
      customer_view: true,
      customer_create: false,
      customer_edit: true,
      customer_delete: false,
      inventory_view: true,
      inventory_edit: false,
      inventory_order: false,
      accounting_view: false,
      accounting_invoice: false,
      accounting_payment: false,
      accounting_report: false,
      report_sales: false,
      report_performance: false,
      report_export: false,
      settings_view: false,
      settings_edit: false,
      user_manage: false,
    },
  });

  useEffect(() => {
    if (!isLoading && !isSuperAdmin()) {
      router.push('/dashboard');
    }
  }, [user, isLoading, isSuperAdmin, router]);

  const handlePermissionToggle = (role: string, permissionId: string) => {
    setRolePermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permissionId]: !prev[role][permissionId],
      },
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    // 実際の実装では、APIを呼び出して権限設定を保存
    console.log('Saving permissions:', rolePermissions);
    setHasChanges(false);
    alert('権限設定を保存しました');
  };

  const handleResetChanges = () => {
    // 変更を元に戻す
    setHasChanges(false);
    alert('変更を元に戻しました');
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
                  <Shield className="h-7 w-7" />
                  権限設定
                </h1>
                <p className="text-sm opacity-90 mt-1">各役職の権限を管理</p>
              </div>
            </div>
            {hasChanges && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetChanges}
                  className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center gap-2 transition"
                >
                  <RefreshCw className="h-4 w-4" />
                  元に戻す
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
                >
                  <Save className="h-5 w-5" />
                  変更を保存
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 役職選択タブ */}
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="border-b">
            <div className="flex overflow-x-auto">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedRole(role)}
                  className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedRole === role
                      ? 'border-b-2 border-red-500 text-red-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 権限マトリックス */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {selectedRole}の権限設定
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <AlertCircle className="h-4 w-4" />
                クリックして権限のON/OFFを切り替えます
              </div>
            </div>

            {permissionCategories.map((category) => (
              <div key={category.name} className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 pb-2 border-b">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.permissions.map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {permission.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {permission.description}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          handlePermissionToggle(selectedRole, permission.id)
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          rolePermissions[selectedRole]?.[permission.id]
                            ? 'bg-green-500'
                            : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            rolePermissions[selectedRole]?.[permission.id]
                              ? 'translate-x-6'
                              : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* プリセットテンプレート */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4">権限テンプレート</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <h4 className="font-medium text-gray-900 mb-1">管理者権限</h4>
              <p className="text-sm text-gray-500">
                全ての機能へのフルアクセス
              </p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <h4 className="font-medium text-gray-900 mb-1">
                一般ユーザー権限
              </h4>
              <p className="text-sm text-gray-500">基本的な機能のみ利用可能</p>
            </button>
            <button className="p-4 border rounded-lg hover:bg-gray-50 text-left">
              <h4 className="font-medium text-gray-900 mb-1">閲覧のみ権限</h4>
              <p className="text-sm text-gray-500">データの閲覧のみ可能</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
