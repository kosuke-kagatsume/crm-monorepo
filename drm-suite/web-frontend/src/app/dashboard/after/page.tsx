'use client';
import MetricCard from '@/components/ui/MetricCard';
export default function AfterDash() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">アフターダッシュ（骨組み）</h1>
      <div className="grid md:grid-cols-3 gap-3">
        <MetricCard title="今週点検" value={4} />
        <MetricCard title="対応中クレーム" value={1} />
        <MetricCard title="完了報告書" value={12} />
      </div>
      <div className="border rounded p-4 text-sm">
        顧客履歴（スプリット仮置き）
      </div>
    </main>
  );
}
