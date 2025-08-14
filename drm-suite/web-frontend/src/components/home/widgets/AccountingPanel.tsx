'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DataTable } from './DataTable';

export function AccountingPanel() {
  const [activeTab, setActiveTab] = useState('invoices');

  const tabs = [
    { id: 'invoices', label: '請求書一覧', tableId: 'invoice_list' },
    { id: 'cashflow', label: 'キャッシュフロー', tableId: 'cashflow' },
    { id: 'dunning', label: '督促状況', tableId: 'dunning' },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">経理業務</CardTitle>
        <div className="flex gap-1 mt-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              size="sm"
              className="text-xs px-3 py-1 h-7"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-2">
        {tabs.map((tab) =>
          activeTab === tab.id ? (
            <DataTable
              key={tab.id}
              role="accounting"
              tableId={tab.tableId}
              maxHeight="240px"
            />
          ) : null,
        )}
      </CardContent>
    </Card>
  );
}
