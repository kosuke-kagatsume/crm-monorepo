'use client';
import MetricCard from '@/components/ui/MetricCard';
export default function SiteDash() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">施工管理ダッシュ（骨組み）</h1>
      <div className="grid md:grid-cols-3 gap-3">
        <MetricCard title="進捗OK現場" value={6} />
        <MetricCard title="遅延リスク" value={1} />
        <MetricCard title="安全書類未提出" value={2} />
      </div>
      <div className="border rounded p-4 text-sm">職人カレンダー（仮置き）</div>
    </main>
  );
}
