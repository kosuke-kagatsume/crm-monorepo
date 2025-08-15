'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { WIDGET_SPECS, type KPIItem } from '@/config/roleWidgets';
import type { Role } from '@/config/roleDashboard';
import { roleMapping } from '@/config/roleDashboard';
import { getKPIValue } from '@/services/stubData';
import { formatKPIValue } from '@/utils/formatters';
import { Mask } from '@/components/acl/Mask';

interface KPIProps {
  role?: Role;
}

export function KPI({ role }: KPIProps) {
  const [currentRole, setCurrentRole] = useState<Role>('mgmt');
  const [kpiData, setKpiData] = useState<Record<string, any>>({});

  // 役職の取得（propsまたはlocalStorage）
  useEffect(() => {
    if (role) {
      setCurrentRole(role);
    } else {
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
        setCurrentRole(directRole as Role);
        return;
      }

      // 従来の日本語役職名でのマッピング
      const userRole = localStorage.getItem('userRole');
      if (userRole && roleMapping[userRole]) {
        setCurrentRole(roleMapping[userRole]);
        return;
      }
    }
  }, [role]);

  // KPIデータの取得
  useEffect(() => {
    const spec = WIDGET_SPECS[currentRole];
    if (spec?.kpis) {
      const data: Record<string, any> = {};
      spec.kpis.forEach((kpi) => {
        data[kpi.id] = getKPIValue(kpi.formulaKey);
      });
      setKpiData(data);
    }
  }, [currentRole]);

  const spec = WIDGET_SPECS[currentRole];
  if (!spec?.kpis) {
    return (
      <Card className="p-6">
        <div className="text-sm text-muted-foreground">KPI</div>
        <div className="text-gray-500">この役職にKPIは設定されていません</div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">KPI</h3>
        <div className="text-xs text-muted-foreground">{currentRole}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {spec.kpis.map((kpi: KPIItem) => {
          const value = kpiData[kpi.id];
          const formattedValue = formatKPIValue(value, kpi.fmt);

          return (
            <div key={kpi.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {kpi.label}
                </span>
                {kpi.hint && (
                  <span
                    className="text-xs text-gray-400 cursor-help"
                    title={kpi.hint}
                  >
                    ℹ️
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {kpi.mask ? (
                  <Mask
                    role={currentRole}
                    can={
                      kpi.mask === 'cost' ? 'canViewCost' : 'canViewGrossMargin'
                    }
                    fallback="—"
                  >
                    {formattedValue}
                  </Mask>
                ) : (
                  formattedValue
                )}
              </div>
              {/* トレンド表示（将来の拡張用） */}
              <div className="text-xs text-gray-500">
                {kpi.fmt === 'currency' && '前月比 +5.2%'}
                {kpi.fmt === 'percent' && '前月 +1.1pt'}
                {kpi.fmt === 'int' && '前日 +2件'}
              </div>
            </div>
          );
        })}
      </div>

      {/* デバッグ情報（開発環境のみ） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-400">
            Debug: {spec.kpis.length} KPIs for {currentRole}
          </div>
        </div>
      )}
    </Card>
  );
}
