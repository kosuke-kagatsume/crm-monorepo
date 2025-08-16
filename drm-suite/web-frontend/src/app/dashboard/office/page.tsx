'use client';
import MetricCard from '@/components/ui/MetricCard';
export default function OfficeDash() {
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">事務ダッシュ（骨組み）</h1>
      <div className="grid md:grid-cols-3 gap-3">
        <MetricCard title="今日の来客" value={3} />
        <MetricCard title="商談席予約" value={5} />
        <MetricCard title="備品予約" value={2} />
      </div>
      <div className="border rounded p-4 text-sm">社内掲示板（仮置き）</div>
    </main>
  );
}
