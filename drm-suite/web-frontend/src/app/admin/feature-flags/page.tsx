'use client';

import { Suspense } from 'react';
import { FeatureFlagPanel } from '@/components/admin/FeatureFlagPanel';

function FeatureFlagsContent() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Feature Flag 管理
            </h1>
            <p className="text-gray-600 mt-2">
              機能の段階公開とテスト用のFeature Flag制御パネル
            </p>
          </div>

          <FeatureFlagPanel />

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-yellow-900 mb-2">⚠️ 注意事項</h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>• 本番環境では慎重にフラグを有効化してください</p>
              <p>• /projects ページは一切変更されていません（安全確保）</p>
              <p>
                • 高リスクフラグ（権限マスク等）は十分にテストを行ってから有効化
              </p>
              <p>• 問題が発生した場合は即座にフラグをOFFにしてください</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeatureFlagsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <FeatureFlagsContent />
    </Suspense>
  );
}
