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

interface NewCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewCustomerDialog({ isOpen, onClose }: NewCustomerDialogProps) {
  const [customerData, setCustomerData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    source: 'web' as 'web' | 'phone' | 'referral' | 'walk-in',
    notes: '',
  });

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'web':
        return 'Web問い合わせ';
      case 'phone':
        return '電話問い合わせ';
      case 'referral':
        return '紹介';
      case 'walk-in':
        return '来店';
      default:
        return source;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 実際の実装では、顧客データをAPIに送信
    console.log('新規顧客データ:', customerData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>👤 新規顧客登録</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">お名前</Label>
              <Input
                id="name"
                value={customerData.name}
                onChange={(e) =>
                  setCustomerData({ ...customerData, name: e.target.value })
                }
                placeholder="田中 太郎"
                required
              />
            </div>
            <div>
              <Label htmlFor="company">会社名</Label>
              <Input
                id="company"
                value={customerData.company}
                onChange={(e) =>
                  setCustomerData({ ...customerData, company: e.target.value })
                }
                placeholder="株式会社サンプル"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                value={customerData.email}
                onChange={(e) =>
                  setCustomerData({ ...customerData, email: e.target.value })
                }
                placeholder="tanaka@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">電話番号</Label>
              <Input
                id="phone"
                type="tel"
                value={customerData.phone}
                onChange={(e) =>
                  setCustomerData({ ...customerData, phone: e.target.value })
                }
                placeholder="03-1234-5678"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="address">住所</Label>
            <Input
              id="address"
              value={customerData.address}
              onChange={(e) =>
                setCustomerData({ ...customerData, address: e.target.value })
              }
              placeholder="東京都渋谷区..."
            />
          </div>
          <div>
            <Label>問い合わせ経路</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {(['web', 'phone', 'referral', 'walk-in'] as const).map(
                (source) => (
                  <Button
                    key={source}
                    type="button"
                    variant={
                      customerData.source === source ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => setCustomerData({ ...customerData, source })}
                  >
                    {getSourceLabel(source)}
                  </Button>
                ),
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="notes">備考</Label>
            <textarea
              id="notes"
              value={customerData.notes}
              onChange={(e) =>
                setCustomerData({ ...customerData, notes: e.target.value })
              }
              placeholder="要望・注意事項など..."
              className="w-full px-3 py-2 border rounded-lg text-sm"
              rows={3}
            />
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-800">💡 事務員向け機能</p>
            <p className="text-xs text-purple-600 mt-1">
              登録後、営業担当者にアサインされます
            </p>
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
