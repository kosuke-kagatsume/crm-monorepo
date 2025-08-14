'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NewDashFlag } from '@/components/common/FeatureFlag';
import { BarChart3, TrendingUp, PieChart } from 'lucide-react';

export function DashboardActions() {
  const router = useRouter();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">📈 ダッシュボード</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 従来のダッシュボード */}
        <Button
          onClick={() => router.push('/dashboard')}
          variant="outline"
          className="w-full justify-start"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          ダッシュボード（従来版）
        </Button>

        {/* 新ダッシュボード（Feature Flag制御） */}
        <NewDashFlag
          fallback={
            <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                🚀 新ダッシュボード
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                ?ff:new_dash=on で利用可能
              </p>
            </div>
          }
        >
          <div className="space-y-2">
            <Button
              onClick={() => router.push('/home?mode=dash')}
              className="w-full justify-start bg-green-600 hover:bg-green-700"
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              新ダッシュボード
            </Button>

            <Button
              onClick={() => router.push('/reports')}
              variant="outline"
              className="w-full justify-start border-green-200 text-green-700 hover:bg-green-50"
            >
              <PieChart className="mr-2 h-4 w-4" />
              レポート分析
            </Button>
          </div>
        </NewDashFlag>

        <div className="pt-3 border-t">
          <p className="text-xs text-gray-500">🔬 新機能のテスト運用中</p>
        </div>
      </CardContent>
    </Card>
  );
}
