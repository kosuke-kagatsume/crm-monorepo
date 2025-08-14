'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Role } from '@/config/roleDashboard';
import { roleConfig, roleMapping, ragPresets } from '@/config/roleDashboard';
import * as W from '@/components/home/widgets';
import { useRagToggle } from '@/components/rag/useRagToggle';
import { RAGPanel } from '@/components/dashboard/RAGPanel';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ShortcutHelp } from '@/components/common/ShortcutHelp';

type WidgetRenderer = Record<string, JSX.Element>;

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<Role | null>(null);
  const rag = useRagToggle();
  const [ragVisible, setRagVisible] = useState(false);

  // 役職の取得方法は既存クイックログインと同じ（localStorageなど）
  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    if (userRole && roleMapping[userRole]) {
      setRole(roleMapping[userRole]);
    } else {
      // デフォルトは経営者
      setRole('mgmt');
    }
  }, []);

  // ホーム画面用のキーボードショートカット
  const { shortcutsEnabled, availableShortcuts } = useKeyboardShortcuts({
    enabled: true,
    shortcuts: [
      {
        key: 'E',
        description: '見積一覧へ移動',
        action: () => router.push('/estimate'),
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
        action: () => router.push('/estimate/new'),
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

  const renderers: Record<string, () => JSX.Element> = useMemo(
    () => ({
      kpi: () => <W.KPI />,
      alerts: () => <W.Alerts />,
      todo: () => <W.Todo />,
      projectsSnap: () => <W.ProjectsSnap />,
      reception: () => <W.Reception />,
      booking: () => <W.Booking />,
      ledgerActions: () => <W.LedgerActions />,
      accountingPanel: () => <W.AccountingPanel />,
      marketingPanel: () => <W.MarketingPanel />,
      aftercareFlow: () => <W.AftercareFlow />,
      ragToggle: () => <W.RagToggle />,
    }),
    [],
  );

  if (!role) return null;

  const widgets = roleConfig[role].widgets;

  return (
    <div className="container mx-auto max-w-6xl py-6 space-y-4">
      {/* 上段：2カラム（KPI/Alerts など） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 左2カラムに主要ウィジェット、右1カラムは操作系やragトグル */}
        <div className="md:col-span-2 space-y-4">
          {widgets
            .filter((w) => w !== 'ragToggle')
            .slice(0, 3)
            .map((w, idx) => (
              <div key={w + idx}>{renderers[w]?.()}</div>
            ))}
        </div>
        <div className="space-y-4">
          {/* 右カラム：ragToggle が定義されていればボタン表示 */}
          {widgets.includes('ragToggle') && (
            <div
              onClick={() => setRagVisible(!ragVisible)}
              className="cursor-pointer"
            >
              <W.RagToggle />
            </div>
          )}
        </div>
      </div>

      {/* 下段：残りのウィジェットを並べる */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets
          .filter((_, i) => i >= 3 && _ !== 'ragToggle')
          .map((w, idx) => (
            <div key={w + idx}>{renderers[w]?.()}</div>
          ))}
      </div>

      {/* RAGパネル */}
      <RAGPanel
        ragPresets={role ? ragPresets[role] || [] : []}
        isVisible={ragVisible}
        onClose={() => setRagVisible(false)}
      />

      {/* キーボードショートカットヘルプ */}
      <ShortcutHelp
        shortcuts={availableShortcuts}
        title="ホーム画面のショートカット"
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
