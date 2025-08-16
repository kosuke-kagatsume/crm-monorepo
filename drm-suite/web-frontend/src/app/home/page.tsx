'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Role } from '@/config/roleDashboard';
import { roleConfig, roleMapping } from '@/config/roleDashboard';
import { WIDGET_SPECS } from '@/config/roleWidgets';
import * as W from '@/components/home/widgets';
import { useRagToggle } from '@/components/rag/useRagToggle';
import { RAGPanel } from '@/components/dashboard/RAGPanel';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ShortcutHelp } from '@/components/common/ShortcutHelp';
import { useHomeShortcuts } from '@/components/home/useHomeShortcuts';
import { ProgressDialog } from '@/components/home/dialogs/ProgressDialog';
import { ChangeOrderDialog } from '@/components/home/dialogs/ChangeOrderDialog';
import { BillingDialog } from '@/components/home/dialogs/BillingDialog';
import { NewCustomerDialog } from '@/components/home/dialogs/NewCustomerDialog';
import { LedgerMergeDialog } from '@/components/home/dialogs/LedgerMergeDialog';
import { isFlagOn } from '@/config/featureFlags';
import { FlagDebugger } from '@/components/common/FeatureFlag';

type WidgetRenderer = Record<string, JSX.Element>;

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role | null>(null);
  const rag = useRagToggle();
  const [ragVisible, setRagVisible] = useState(false);

  // ダイアログ状態管理
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [changeOrderDialogOpen, setChangeOrderDialogOpen] = useState(false);
  const [billingDialogOpen, setBillingDialogOpen] = useState(false);
  const [newCustomerDialogOpen, setNewCustomerDialogOpen] = useState(false);
  const [ledgerMergeDialogOpen, setLedgerMergeDialogOpen] = useState(false);

  // 新ダッシュモード検出（?ff:new_dash=on のみで制御）
  const isNewDashMode = isFlagOn('new_dash');

  // 役職の取得（localStorage.userRole または localStorage.role）
  useEffect(() => {
    // 直接Role型での設定をサポート（localStorage.role = 'mgmt'）
    const directRole = localStorage.getItem('role');
    if (
      directRole &&
      [
        'mgmt',
        'branch',
        'sales',
        'accounting',
        'marketing',
        'foreman',
        'clerk',
        'aftercare',
      ].includes(directRole)
    ) {
      setRole(directRole as Role);
      return;
    }

    // 従来の日本語役職名でのマッピング
    const userRole = localStorage.getItem('userRole');
    if (userRole && roleMapping[userRole]) {
      setRole(roleMapping[userRole]);
      return;
    }

    // デフォルトは経営者
    setRole('mgmt');
  }, []);

  // ホーム画面用のキーボードショートカット
  const { shortcutsEnabled, availableShortcuts } = useKeyboardShortcuts({
    enabled: true,
    shortcuts: [
      {
        key: 'E',
        description: '見積一覧へ移動',
        action: () => router.push('/estimates'),
        enabled: true,
      },
      {
        key: 'H',
        description: 'ホームに戻る',
        action: () => router.push('/home'),
        enabled: true,
      },
      {
        key: 'R',
        description: 'RAGパネル切り替え',
        action: () => setRagVisible(!ragVisible),
        enabled: true,
      },
      {
        key: 'N',
        description: '新規見積作成',
        action: () => router.push('/estimates/new'),
        enabled: true,
      },
      {
        key: '?',
        description: 'ショートカットヘルプ表示',
        action: () => {}, // ShortcutHelpコンポーネントで処理
        enabled: true,
      },
    ],
  });

  // 役職別ショートカット定義
  const shortcutsForRole: Record<Role, any> = {
    mgmt: {
      E: () => router.push('/estimate'),
      R: () => setRagVisible(!ragVisible),
    },
    branch: {
      E: () => router.push('/estimate'),
      R: () => setRagVisible(!ragVisible),
    },
    sales: {
      E: () => router.push('/estimate'),
      N: () => router.push('/estimate/new'),
      R: () => setRagVisible(!ragVisible),
    },
    accounting: {
      R: () => setRagVisible(!ragVisible),
    },
    marketing: {
      R: () => setRagVisible(!ragVisible),
    },
    foreman: {
      E: () => setProgressDialogOpen(true), // 出来高ダイアログ
      C: () => setChangeOrderDialogOpen(true), // CO起票
      B: () => setBillingDialogOpen(true), // 請求案
      R: () => setRagVisible(!ragVisible),
    },
    clerk: {
      N: () => setNewCustomerDialogOpen(true), // 新規顧客ダイアログ
      R: () => setRagVisible(!ragVisible),
    },
    aftercare: {
      M: () => setLedgerMergeDialogOpen(true), // 見積→台帳合流
      R: () => setRagVisible(!ragVisible),
    },
  };

  // 役職別ショートカットを適用
  useHomeShortcuts(role ? (shortcutsForRole[role] ?? {}) : {}, {
    enabled: true,
  });

  const renderers: Record<string, () => JSX.Element> = useMemo(
    () => ({
      kpi: () => <W.KPI role={role || 'mgmt'} />,
      alerts: () => <W.Alerts />,
      todo: () => <W.Todo />,
      projectsSnap: () => <W.ProjectsSnap />,
      reception: () => <W.Reception />,
      booking: () => <W.Booking />,
      ledgerActions: () => <W.LedgerActions />,
      accountingPanel: () => <W.AccountingPanel />,
      marketingPanel: () => <W.MarketingPanel />,
      aftercareFlow: () => <W.AftercareFlow />,
      ragToggle: () => (
        <W.RagToggle
          onClick={() => setRagVisible(!ragVisible)}
          isOpen={ragVisible}
        />
      ),
      estimateActions: () => <W.EstimateActions />,
      dashboardActions: () => <W.DashboardActions />,
      clerkActions: () => <W.ClerkActions />,
    }),
    [role, ragVisible],
  );

  if (!role) return null;

  const widgets = roleConfig[role].widgets;

  // 新ダッシュモード専用レンダリング
  if (isNewDashMode) {
    return (
      <div className="container mx-auto max-w-7xl py-6 space-y-4">
        {/* 新ダッシュヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">🚀 新ダッシュボード</h1>
              <p className="text-blue-100">Feature Flag で有効化されています</p>
            </div>
            <div className="flex gap-2">
              <FlagDebugger flag="new_dash" />
              <button
                onClick={() => router.push('/home')}
                className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm hover:bg-blue-50"
              >
                従来版に戻る
              </button>
            </div>
          </div>
        </div>

        {/* 新ダッシュレイアウト（横長3カラム） */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {widgets.slice(0, 6).map((w, idx) => (
            <div key={w + idx} className="h-full">
              {renderers[w]?.()}
            </div>
          ))}
        </div>

        {/* 新ダッシュ用RAGパネル */}
        <RAGPanel
          ragPresets={role ? WIDGET_SPECS[role]?.rag || [] : []}
          isVisible={ragVisible}
          onClose={() => setRagVisible(false)}
          userRole={role || 'sales'}
        />
      </div>
    );
  }

  // 従来のホームレイアウト
  return (
    <div className="container mx-auto max-w-6xl py-6 space-y-4">
      {/* 役職＆デバッグ情報 */}
      <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            現在の役職: <span className="text-blue-600">{role}</span>
          </span>
          {process.env.NODE_ENV === 'development' && (
            <div className="text-xs text-gray-500">
              localStorage.role = '{role}' で切替可能
            </div>
          )}
          <a
            href="/dash"
            className="inline-flex items-center gap-2 text-sm border rounded px-3 py-1 hover:bg-gray-100"
          >
            🚀 新ダッシュ（β）へ
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="flex gap-2">
            <FlagDebugger flag="new_dash" />
            <FlagDebugger flag="new_estimate" />
            <FlagDebugger flag="keyboard_shortcuts" />
          </div>
        )}
      </div>

      {/* roleConfigの順序通りにウィジェット配置 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 左2カラム：KPIなどメインウィジェット */}
        <div className="md:col-span-2 space-y-4">
          {widgets
            .filter((w) => w !== 'ragToggle')
            .slice(0, 2) // 上段2つまで
            .map((w, idx) => (
              <div key={w + idx}>{renderers[w]?.()}</div>
            ))}
        </div>

        {/* 右カラム：RAGトグルボタン + その他 */}
        <div className="space-y-4">
          {/* RAGトグルボタンを右列に表示 */}
          {widgets.includes('ragToggle') && (
            <W.RagToggle
              onClick={() => setRagVisible(!ragVisible)}
              isOpen={ragVisible}
            />
          )}

          {/* 右カラム用の追加ウィジェット（3番目以降で小さなもの） */}
          {widgets
            .filter((w) => w !== 'ragToggle')
            .slice(2, 3) // 3番目のウィジェットを右カラムに
            .map((w, idx) => (
              <div key={w + idx + 'right'}>{renderers[w]?.()}</div>
            ))}
        </div>
      </div>

      {/* 中段・下段：残りのウィジェット */}
      {widgets.filter((w) => w !== 'ragToggle').length > 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {widgets
            .filter((w) => w !== 'ragToggle')
            .slice(3) // 4番目以降
            .map((w, idx) => (
              <div key={w + idx + 'bottom'}>{renderers[w]?.()}</div>
            ))}
        </div>
      )}

      {/* RAGパネル */}
      <RAGPanel
        ragPresets={role ? WIDGET_SPECS[role]?.rag || [] : []}
        isVisible={ragVisible}
        onClose={() => setRagVisible(false)}
        userRole={role || 'sales'}
      />

      {/* キーボードショートカットヘルプ */}
      <ShortcutHelp
        shortcuts={availableShortcuts}
        title="ホーム画面のショートカット"
      />

      {/* 役職別ダイアログ */}
      <ProgressDialog
        isOpen={progressDialogOpen}
        onClose={() => setProgressDialogOpen(false)}
      />

      <ChangeOrderDialog
        isOpen={changeOrderDialogOpen}
        onClose={() => setChangeOrderDialogOpen(false)}
      />

      <BillingDialog
        isOpen={billingDialogOpen}
        onClose={() => setBillingDialogOpen(false)}
      />

      <NewCustomerDialog
        isOpen={newCustomerDialogOpen}
        onClose={() => setNewCustomerDialogOpen(false)}
      />

      <LedgerMergeDialog
        isOpen={ledgerMergeDialogOpen}
        onClose={() => setLedgerMergeDialogOpen(false)}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-6xl py-6 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
