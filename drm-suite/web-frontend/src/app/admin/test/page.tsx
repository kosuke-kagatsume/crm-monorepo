'use client';

import { ProjectsRegressionTest } from '@/components/test/ProjectsRegression';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">回帰テスト管理</h1>
            <p className="text-gray-600 mt-2">
              既存機能の「壊さない」を保証するための自動テストシステム
            </p>
          </div>

          <ProjectsRegressionTest />

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">
              📋 テスト項目について
            </h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>
                <strong>Visual:</strong> レイアウト・デザインの視覚的回帰
              </p>
              <p>
                <strong>Functional:</strong> 機能動作の確認
              </p>
              <p>
                <strong>Integration:</strong> 他システムとの連携確認
              </p>
              <p>
                <strong>クリティカル:</strong> 業務に直接影響する重要テスト
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-900 mb-2">
              ✅ 実装済みガードレール
            </h3>
            <div className="text-sm text-green-800 space-y-1">
              <p>• Feature Flag による新機能の完全分離</p>
              <p>• /projects ページの変更禁止ポリシー</p>
              <p>• 段階的ロールアウトによるリスク最小化</p>
              <p>• 権限マスクによる情報漏洩防止</p>
              <p>• RAG引用必須による信頼性確保</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
