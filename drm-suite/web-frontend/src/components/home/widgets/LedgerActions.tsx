'use client';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function LedgerActions() {
  const router = useRouter();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          📊 台帳アクション
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          className="w-full"
          variant="default"
          onClick={() => alert('出来高登録（未実装）')}
        >
          📈 出来高登録
        </Button>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => alert('CO起票（未実装）')}
        >
          📝 CO起票
        </Button>
        <Button
          className="w-full"
          variant="outline"
          onClick={() => alert('請求書作成（未実装）')}
        >
          💰 請求書作成
        </Button>
        <Button
          className="w-full"
          variant="secondary"
          onClick={() => router.push('/ledger/overview')}
        >
          📑 台帳サマリーへ
        </Button>
      </CardContent>
    </Card>
  );
}
