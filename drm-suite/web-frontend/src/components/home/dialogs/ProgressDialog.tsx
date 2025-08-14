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

interface ProgressDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProgressDialog({ isOpen, onClose }: ProgressDialogProps) {
  const [progressData, setProgressData] = useState({
    projectId: '',
    completionRate: '',
    amount: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 実際の実装では、出来高データをAPIに送信
    console.log('出来高データ:', progressData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>📊 出来高入力</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="projectId">案件ID</Label>
            <Input
              id="projectId"
              value={progressData.projectId}
              onChange={(e) =>
                setProgressData({ ...progressData, projectId: e.target.value })
              }
              placeholder="PRJ-001"
            />
          </div>
          <div>
            <Label htmlFor="completionRate">進捗率 (%)</Label>
            <Input
              id="completionRate"
              type="number"
              max="100"
              value={progressData.completionRate}
              onChange={(e) =>
                setProgressData({
                  ...progressData,
                  completionRate: e.target.value,
                })
              }
              placeholder="45"
            />
          </div>
          <div>
            <Label htmlFor="amount">出来高金額</Label>
            <Input
              id="amount"
              type="number"
              value={progressData.amount}
              onChange={(e) =>
                setProgressData({ ...progressData, amount: e.target.value })
              }
              placeholder="500000"
            />
          </div>
          <div>
            <Label htmlFor="notes">備考</Label>
            <Input
              id="notes"
              value={progressData.notes}
              onChange={(e) =>
                setProgressData({ ...progressData, notes: e.target.value })
              }
              placeholder="作業内容の詳細..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">登録</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
