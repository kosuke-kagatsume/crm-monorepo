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

interface LedgerMergeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LedgerMergeDialog({ isOpen, onClose }: LedgerMergeDialogProps) {
  const [mergeData, setMergeData] = useState({
    estimateId: '',
    versionId: '',
    mergeType: 'aftercare' as 'aftercare' | 'maintenance' | 'warranty',
    targetDate: '',
    responsiblePerson: '',
    notes: '',
  });

  const getMergeTypeLabel = (type: string) => {
    switch (type) {
      case 'aftercare':
        return 'アフターケア';
      case 'maintenance':
        return 'メンテナンス';
      case 'warranty':
        return '保証管理';
      default:
        return type;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 実際の実装では、台帳合流データをAPIに送信
    console.log('台帳合流データ:', mergeData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>📋 見積→台帳合流</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="estimateId">見積ID</Label>
              <Input
                id="estimateId"
                value={mergeData.estimateId}
                onChange={(e) =>
                  setMergeData({ ...mergeData, estimateId: e.target.value })
                }
                placeholder="EST-001"
                required
              />
            </div>
            <div>
              <Label htmlFor="versionId">バージョン</Label>
              <Input
                id="versionId"
                value={mergeData.versionId}
                onChange={(e) =>
                  setMergeData({ ...mergeData, versionId: e.target.value })
                }
                placeholder="v2.1"
                required
              />
            </div>
          </div>
          <div>
            <Label>合流種別</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['aftercare', 'maintenance', 'warranty'] as const).map(
                (type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={
                      mergeData.mergeType === type ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      setMergeData({ ...mergeData, mergeType: type })
                    }
                  >
                    {getMergeTypeLabel(type)}
                  </Button>
                ),
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="targetDate">対象開始日</Label>
            <Input
              id="targetDate"
              type="date"
              value={mergeData.targetDate}
              onChange={(e) =>
                setMergeData({ ...mergeData, targetDate: e.target.value })
              }
              required
            />
          </div>
          <div>
            <Label htmlFor="responsiblePerson">担当者</Label>
            <Input
              id="responsiblePerson"
              value={mergeData.responsiblePerson}
              onChange={(e) =>
                setMergeData({
                  ...mergeData,
                  responsiblePerson: e.target.value,
                })
              }
              placeholder="山田 花子"
              required
            />
          </div>
          <div>
            <Label htmlFor="notes">合流メモ</Label>
            <textarea
              id="notes"
              value={mergeData.notes}
              onChange={(e) =>
                setMergeData({ ...mergeData, notes: e.target.value })
              }
              placeholder="台帳登録に関するメモ..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={3}
            />
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-sm text-orange-800">
              💡 アフターケア担当者向け機能
            </p>
            <p className="text-xs text-orange-600 mt-1">
              見積確定バージョンを台帳システムに登録し、長期管理を開始します
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              キャンセル
            </Button>
            <Button type="submit">台帳に登録</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
