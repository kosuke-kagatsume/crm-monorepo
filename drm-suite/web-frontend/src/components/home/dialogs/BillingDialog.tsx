'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface BillingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BillingDialog({ isOpen, onClose }: BillingDialogProps) {
  const [billingData, setBillingData] = useState({
    estimateId: '',
    billingType: 'deposit' as 'deposit' | 'middle' | 'final' | 'custom',
    amount: '',
    dueDate: '',
    notes: '',
  });

  const getBillingTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return '着工金';
      case 'middle':
        return '中間金';
      case 'final':
        return '最終金';
      case 'custom':
        return 'カスタム';
      default:
        return type;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 実際の実装では、請求案データをAPIに送信
    console.log('請求案データ:', billingData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>💰 請求案作成</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="estimateId">対象見積ID</Label>
            <Input
              id="estimateId"
              value={billingData.estimateId}
              onChange={(e) =>
                setBillingData({ ...billingData, estimateId: e.target.value })
              }
              placeholder="EST-001"
              required
            />
          </div>
          <div>
            <Label>請求種別</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {(['deposit', 'middle', 'final', 'custom'] as const).map(
                (type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={
                      billingData.billingType === type ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      setBillingData({ ...billingData, billingType: type })
                    }
                  >
                    {getBillingTypeLabel(type)}
                  </Button>
                ),
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="amount">請求金額（円）</Label>
            <Input
              id="amount"
              type="number"
              value={billingData.amount}
              onChange={(e) =>
                setBillingData({ ...billingData, amount: e.target.value })
              }
              placeholder="500000"
              required
            />
          </div>
          <div>
            <Label htmlFor="dueDate">支払期日</Label>
            <Input
              id="dueDate"
              type="date"
              value={billingData.dueDate}
              onChange={(e) =>
                setBillingData({ ...billingData, dueDate: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="notes">備考</Label>
            <textarea
              id="notes"
              value={billingData.notes}
              onChange={(e) =>
                setBillingData({ ...billingData, notes: e.target.value })
              }
              placeholder="請求に関する備考..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={3}
            />
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              💡 現場代理人・工事主任向け機能
            </p>
            <p className="text-xs text-green-600 mt-1">
              作成後、経理担当者に通知されます
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">作成</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
