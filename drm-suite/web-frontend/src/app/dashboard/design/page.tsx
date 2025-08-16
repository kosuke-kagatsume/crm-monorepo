'use client';
import MetricCard from '@/components/ui/MetricCard';
export default function DesignDash() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">設計ダッシュ（骨組み）</h1>
      <div className="grid md:grid-cols-3 gap-3">
        <MetricCard title="承認待ち" value={4} />
        <MetricCard title="実施図作成中" value={7} />
        <MetricCard title="外部依頼" value={2} />
      </div>
      <div className="border rounded p-4 text-sm">
        設計変更履歴（テーブル仮置き）
      </div>
    </main>
  );
}
