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

interface ChangeOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangeOrderDialog({ isOpen, onClose }: ChangeOrderDialogProps) {
  const [coData, setCoData] = useState({
    title: '',
    reason: '',
    amount: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    estimateId: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 実際の実装では、CO起票データをAPIに送信
    console.log('CO起票データ:', coData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>🔄 変更工事（CO）起票</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="estimateId">対象見積ID</Label>
            <Input
              id="estimateId"
              value={coData.estimateId}
              onChange={(e) =>
                setCoData({ ...coData, estimateId: e.target.value })
              }
              placeholder="EST-001"
              required
            />
          </div>
          <div>
            <Label htmlFor="title">変更工事名</Label>
            <Input
              id="title"
              value={coData.title}
              onChange={(e) => setCoData({ ...coData, title: e.target.value })}
              placeholder="キッチン仕様変更"
              required
            />
          </div>
          <div>
            <Label htmlFor="reason">変更理由</Label>
            <Input
              id="reason"
              value={coData.reason}
              onChange={(e) => setCoData({ ...coData, reason: e.target.value })}
              placeholder="お客様要望による仕様変更"
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">変更金額（円）</Label>
            <Input
              id="amount"
              type="number"
              value={coData.amount}
              onChange={(e) => setCoData({ ...coData, amount: e.target.value })}
              placeholder="150000"
            />
          </div>
          <div>
            <Label>優先度</Label>
            <div className="flex gap-2 mt-1">
              {(['high', 'medium', 'low'] as const).map((priority) => (
                <Button
                  key={priority}
                  type="button"
                  variant={coData.priority === priority ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCoData({ ...coData, priority })}
                >
                  <Badge
                    variant={
                      priority === 'high'
                        ? 'destructive'
                        : priority === 'medium'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {priority === 'high'
                      ? '高'
                      : priority === 'medium'
                        ? '中'
                        : '低'}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 現場代理人・工事主任向け機能
            </p>
            <p className="text-xs text-blue-600 mt-1">
              起票後、営業担当者に通知されます
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">起票</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
