'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  WIDGET_SPECS,
  type TableDef,
  type TableColumn,
} from '@/config/roleWidgets';
import type { Role } from '@/config/roleDashboard';
import { roleMapping } from '@/config/roleDashboard';
import { getTableData } from '@/services/stubData';
import { formatValue } from '@/utils/formatters';
import { Mask } from '@/components/acl/Mask';

interface DataTableProps {
  role?: Role;
  tableId?: string; // 特定のテーブルのみ表示する場合
  maxHeight?: string;
}

export function DataTable({
  role,
  tableId,
  maxHeight = '400px',
}: DataTableProps) {
  const [currentRole, setCurrentRole] = useState<Role>('mgmt');
  const [tablesData, setTablesData] = useState<Record<string, any[]>>({});

  // 役職の取得
  useEffect(() => {
    if (role) {
      setCurrentRole(role);
    } else {
      const userRole = localStorage.getItem('userRole');
      if (userRole && roleMapping[userRole]) {
        setCurrentRole(roleMapping[userRole]);
      }
    }
  }, [role]);

  // テーブルデータの取得
  useEffect(() => {
    const spec = WIDGET_SPECS[currentRole];
    if (spec?.tables) {
      const data: Record<string, any[]> = {};
      spec.tables.forEach((table) => {
        data[table.id] = getTableData(table.sourceKey);
      });
      setTablesData(data);
    }
  }, [currentRole]);

  const spec = WIDGET_SPECS[currentRole];
  if (!spec?.tables) {
    return (
      <Card className="p-6">
        <CardTitle>データテーブル</CardTitle>
        <div className="text-gray-500 mt-2">
          この役職にテーブルは設定されていません
        </div>
      </Card>
    );
  }

  // 特定のテーブルのみ表示する場合
  const tablesToShow = tableId
    ? spec.tables.filter((table) => table.id === tableId)
    : spec.tables;

  if (tablesToShow.length === 0) {
    return (
      <Card className="p-6">
        <CardTitle>データテーブル</CardTitle>
        <div className="text-gray-500 mt-2">
          指定されたテーブルが見つかりません
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {tablesToShow.map((table: TableDef) => {
        const data = tablesData[table.id] || [];

        return (
          <Card key={table.id} className={tableId ? '' : 'border'}>
            {!tableId && (
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  {table.title}
                  <Badge variant="outline" className="text-xs">
                    {data.length}件
                  </Badge>
                </CardTitle>
              </CardHeader>
            )}
            <CardContent>
              <div
                className="overflow-auto border rounded-lg"
                style={{ maxHeight }}
              >
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {table.columns.map((column: TableColumn) => (
                        <th
                          key={column.key}
                          className="text-left px-4 py-3 font-medium text-gray-900"
                          style={{
                            width: column.width ? `${column.width}px` : 'auto',
                          }}
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr>
                        <td
                          colSpan={table.columns.length}
                          className="text-center py-8 text-gray-500"
                        >
                          データがありません
                        </td>
                      </tr>
                    ) : (
                      data.map((row: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          {table.columns.map((column: TableColumn) => {
                            const cellValue = row[column.key];
                            let formattedValue = formatValue(
                              cellValue,
                              column.fmt,
                            );

                            return (
                              <td key={column.key} className="px-4 py-3">
                                {column.mask ? (
                                  <Mask
                                    role={currentRole}
                                    can={
                                      column.mask === 'cost'
                                        ? 'canViewCost'
                                        : 'canViewGrossMargin'
                                    }
                                    fallback="［非表示］"
                                  >
                                    {column.fmt === 'status' &&
                                    typeof formattedValue === 'object' ? (
                                      <Badge
                                        variant={
                                          formattedValue.variant === 'success'
                                            ? 'default'
                                            : formattedValue.variant ===
                                                'warning'
                                              ? 'secondary'
                                              : formattedValue.variant ===
                                                  'danger'
                                                ? 'destructive'
                                                : 'outline'
                                        }
                                      >
                                        {formattedValue.text}
                                      </Badge>
                                    ) : (
                                      String(formattedValue)
                                    )}
                                  </Mask>
                                ) : column.fmt === 'status' &&
                                  typeof formattedValue === 'object' ? (
                                  <Badge
                                    variant={
                                      formattedValue.variant === 'success'
                                        ? 'default'
                                        : formattedValue.variant === 'warning'
                                          ? 'secondary'
                                          : formattedValue.variant === 'danger'
                                            ? 'destructive'
                                            : 'outline'
                                    }
                                  >
                                    {formattedValue.text}
                                  </Badge>
                                ) : (
                                  String(formattedValue)
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ページング（将来の拡張用） */}
              {table.pageSize && data.length > table.pageSize && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    {data.length}件中 1-{Math.min(table.pageSize, data.length)}
                    件を表示
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      disabled
                    >
                      前へ
                    </button>
                    <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">
                      次へ
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* デバッグ情報 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400">
          Debug: {tablesToShow.length} table(s) for {currentRole}
        </div>
      )}
    </div>
  );
}
