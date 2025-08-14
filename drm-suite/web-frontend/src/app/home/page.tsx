'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Role } from '@/config/roleDashboard';
import { roleConfig, roleMapping } from '@/config/roleDashboard';
import * as W from '@/components/home/widgets';
import { useRagToggle } from '@/components/rag/useRagToggle';

type WidgetRenderer = Record<string, JSX.Element>;

export default function HomePage() {
  const [role, setRole] = useState<Role | null>(null);
  const rag = useRagToggle();

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

  const renderers: Record<string, () => JSX.Element> = useMemo(() => ({
    kpi:            () => <W.KPI />,
    alerts:         () => <W.Alerts />,
    todo:           () => <W.Todo />,
    projectsSnap:   () => <W.ProjectsSnap />,
    reception:      () => <W.Reception />,
    booking:        () => <W.Booking />,
    ledgerActions:  () => <W.LedgerActions />,
    accountingPanel:() => <W.AccountingPanel />,
    marketingPanel: () => <W.MarketingPanel />,
    aftercareFlow:  () => <W.AftercareFlow />,
    ragToggle:      () => <W.RagToggle />,
  }), []);

  if (!role) return null;

  const widgets = roleConfig[role].widgets;

  return (
    <div className="container mx-auto max-w-6xl py-6 space-y-4">
      {/* 上段：2カラム（KPI/Alerts など） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 左2カラムに主要ウィジェット、右1カラムは操作系やragトグル */}
        <div className="md:col-span-2 space-y-4">
          {widgets.filter(w => w !== 'ragToggle').slice(0, 3).map((w, idx) => (
            <div key={w + idx}>{renderers[w]?.()}</div>
          ))}
        </div>
        <div className="space-y-4">
          {/* 右カラム：ragToggle が定義されていればボタン表示 */}
          {widgets.includes('ragToggle') && <W.RagToggle />}
          {/* RAGのドロワーは後で統合。今回はボタンのみでOK */}
        </div>
      </div>

      {/* 下段：残りのウィジェットを並べる */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {widgets.filter((_, i) => i >= 3 && _ !== 'ragToggle').map((w, idx) => (
          <div key={w + idx}>{renderers[w]?.()}</div>
        ))}
      </div>
    </div>
  );
}