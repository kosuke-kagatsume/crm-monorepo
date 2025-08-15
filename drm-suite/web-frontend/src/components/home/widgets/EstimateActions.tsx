'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NewEstimateFlag } from '@/components/common/FeatureFlag';
import { Calculator, Plus, List } from 'lucide-react';

export function EstimateActions() {
  const router = useRouter();

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">📊 見積システム</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 従来の見積一覧 */}
        <Button
          onClick={() => router.push('/estimates')}
          variant="outline"
          className="w-full justify-start"
        >
          <List className="mr-2 h-4 w-4" />
          見積一覧（従来版）
        </Button>

        {/* 新見積システム（Feature Flag制御） */}
        <NewEstimateFlag
          fallback={
            <div className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                🚀 新見積システム
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                ?ff:new_estimate=on で利用可能
              </p>
            </div>
          }
        >
          <div className="space-y-2">
            <Button
              onClick={() => router.push('/estimates')}
              className="w-full justify-start bg-blue-600 hover:bg-blue-700"
            >
              <Calculator className="mr-2 h-4 w-4" />
              見積システム（新版）
            </Button>

            <Button
              onClick={() => router.push('/estimates/new')}
              variant="outline"
              className="w-full justify-start border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              新規見積作成
            </Button>
          </div>
        </NewEstimateFlag>

        <div className="pt-3 border-t">
          <p className="text-xs text-gray-500">
            💡 新システムは段階的に公開されます
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
