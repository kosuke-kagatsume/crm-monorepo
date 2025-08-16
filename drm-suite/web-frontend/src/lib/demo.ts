export function demoOverview() {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const revenue = [12, 14, 11, 16, 18, 22].map((x) => x * 1_000_000);
  const estCost = revenue.map((v, i) => Math.round(v * (i % 2 ? 0.68 : 0.62)));
  const committed = estCost.map((v) => Math.round(v * 0.92));
  const actual = estCost.map((v) => Math.round(v * 0.88));
  const gross =
    revenue.reduce((a, b) => a + b, 0) - estCost.reduce((a, b) => a + b, 0);
  return {
    kpi: {
      revenue: revenue.reduce((a, b) => a + b, 0),
      estCost: estCost.reduce((a, b) => a + b, 0),
      committed: committed.reduce((a, b) => a + b, 0),
      actual: actual.reduce((a, b) => a + b, 0),
      gross,
      margin:
        Math.round((gross / revenue.reduce((a, b) => a + b, 0)) * 1000) / 10,
    },
    trend: { months, revenue, estCost, committed, actual },
    alerts: {
      overdue: 2,
      pending: 3,
      topPending: [
        {
          project_code: 'PRJ-0008',
          vendor: '山田建材',
          due_date: '2025-08-20',
          remain: 2500000,
          overdue: true,
        },
        {
          project_code: 'PRJ-0012',
          vendor: '佐藤左官',
          due_date: '2025-08-22',
          remain: 1200000,
          overdue: false,
        },
      ],
    },
    varianceTop5: [
      { project_code: 'PRJ-0005', name: '本社改修', diff: +1800000 },
      { project_code: 'PRJ-0002', name: '外壁改修', diff: -950000 },
      { project_code: 'PRJ-0010', name: '新築A', diff: +620000 },
      { project_code: 'PRJ-0007', name: '倉庫改装', diff: -480000 },
      { project_code: 'PRJ-0001', name: 'モデルハウス', diff: +300000 },
    ],
  };
}
export function demoPay() {
  const d = new Date();
  const ym = (o: number) => {
    const t = new Date(d);
    t.setMonth(t.getMonth() + o);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`;
  };
  return { [ym(0)]: 4_500_000, [ym(1)]: 3_200_000, [ym(2)]: 5_800_000 };
}
