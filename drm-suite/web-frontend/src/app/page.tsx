'use client'

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            DRM Suite v1.1
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Dandori Relation Management System - UAT Ready
          </p>
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">
              統合型CRM + Multi-Agent RAG v2.0
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-left mb-6">
              <div className="p-4 bg-blue-50 rounded">
                <h3 className="font-semibold text-blue-900">受付・予約管理</h3>
                <p className="text-sm text-gray-600">リソース同時予約対応</p>
              </div>
              <div className="p-4 bg-green-50 rounded">
                <h3 className="font-semibold text-green-900">経費・原価管理</h3>
                <p className="text-sm text-gray-600">承認フロー・粗利分析</p>
              </div>
              <div className="p-4 bg-purple-50 rounded">
                <h3 className="font-semibold text-purple-900">アフターケア</h3>
                <p className="text-sm text-gray-600">定期点検・不具合対応</p>
                <span className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded mt-1 inline-block">v1.1新機能</span>
              </div>
              <div className="p-4 bg-orange-50 rounded">
                <h3 className="font-semibold text-orange-900">会計元帳</h3>
                <p className="text-sm text-gray-600">仕訳・財務諸表</p>
                <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded mt-1 inline-block">v1.1新機能</span>
              </div>
              <div className="p-4 bg-indigo-50 rounded">
                <h3 className="font-semibold text-indigo-900">DW連携</h3>
                <p className="text-sm text-gray-600">進捗・変更指示書</p>
                <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded mt-1 inline-block">v1.1新機能</span>
              </div>
              <div className="p-4 bg-pink-50 rounded">
                <h3 className="font-semibold text-pink-900">役職別ダッシュボード</h3>
                <p className="text-sm text-gray-600">カスタマイズ可能</p>
                <span className="text-xs bg-pink-200 text-pink-800 px-2 py-1 rounded mt-1 inline-block">v1.1新機能</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded text-white">
              <h3 className="font-semibold mb-2">🤖 Multi-Agent RAG v2.0</h3>
              <p className="text-sm mb-2">複数のAIエージェントが協調して高度な分析を実現</p>
              <ul className="text-xs space-y-1">
                <li>• 文書理解エージェント：契約書・仕様書の解析</li>
                <li>• 分析エージェント：KPI・財務データの洞察</li>
                <li>• タスク管理エージェント：業務フロー最適化</li>
                <li>• 役職別マスキング：機密情報の自動保護</li>
              </ul>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <h4 className="font-semibold text-sm mb-1">E2Eテスト完備</h4>
                <p className="text-xs text-gray-600">Playwright自動テストで品質保証</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <h4 className="font-semibold text-sm mb-1">監査ログ対応</h4>
                <p className="text-xs text-gray-600">全操作の追跡・コンプライアンス</p>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-500">
              <p>Tech Stack: Next.js 14, NestJS, Prisma, LangChain, Kafka</p>
              <p>© 2024 DRM Suite v1.1 - Enterprise CRM Solution</p>
            </div>
            
            <div className="mt-6 flex gap-3 justify-center">
              <a 
                href="/login"
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium inline-block"
              >
                ログイン
              </a>
              <button className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-medium">
                ドキュメント
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
