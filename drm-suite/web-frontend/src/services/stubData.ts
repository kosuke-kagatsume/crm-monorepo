// スタブデータプロバイダー

// KPIデータのスタブ
export const KPI_STUB_DATA: Record<string, any> = {
  // 売上関連
  'sales.mtd': 15420000, // 今月売上
  'sales.ytd': 182500000, // 年間売上

  // 粗利関連
  'grossMargin.rate': 34.5, // 粗利率
  'grossMargin.amount': 5315000, // 粗利額

  // 資金関連
  'cash.balance': 24800000, // 手持ち資金
  'cash.incomingWeek': 3200000, // 今週入金予定

  // 売掛金関連
  'ar.total': 8500000, // 未収金
  'ar.overdueCount': 7, // 回収遅延件数

  // 契約関連
  'contracts.mtd': 23, // 今月契約数
  'contracts.ytd': 287, // 年間契約数

  // 承認関連
  'approvals.pending': 5, // 承認待ち
  'projects.delayed': 3, // 遅延案件

  // 営業関連
  'leads.today': 12, // 本日の新規反響
  'quotes.dueCount': 8, // 見積提出期限
  'visits.today': 4, // 本日の来店予定

  // マーケティング関連
  'web.visits': 1250, // 訪問数
  'web.conversionRate': 2.8, // CV率
  'ads.cpa': 3500, // CPA

  // 施工管理関連
  'sites.today': 6, // 今日の現場
  'progress.avg': 67.5, // 平均進捗
  'earned.value': 45200000, // 累計出来高
  'billing.unapproved': 2100000, // 未承認請求

  // 事務関連
  'sla.firstResponseMinutes': 12, // 平均初動応答時間
  'inquiries.unrepliedToday': 3, // 当日未返信
  'reception.csScore': 87, // 受付満足度

  // アフターケア関連
  'after.inspectionsWeek': 15, // 今週点検
  'after.defectsPending': 4, // 是正保留
  'after.csNps': 72, // 満足度(NPS)
};

// テーブルデータのスタブ
export const TABLE_STUB_DATA: Record<string, any[]> = {
  // 拠点別パフォーマンス
  'branch.performance': [
    {
      branch: '本社',
      sales: 8500000,
      gmRate: 35.2,
      overdue: 2,
      trend: '↗️ 好調',
    },
    {
      branch: '大阪支店',
      sales: 4200000,
      gmRate: 31.8,
      overdue: 3,
      trend: '→ 横ばい',
    },
    {
      branch: '名古屋支店',
      sales: 2720000,
      gmRate: 33.1,
      overdue: 2,
      trend: '↗️ 改善',
    },
  ],

  // 重要アラート
  'alerts.critical': [
    {
      type: '売掛金',
      target: '田中建設',
      impact: '高',
      due: '2024-12-25',
      owner: '経理部',
    },
    {
      type: '現場遅延',
      target: '新宿プロジェクト',
      impact: '中',
      due: '2024-12-28',
      owner: '施工管理',
    },
    {
      type: '契約期限',
      target: '横浜案件',
      impact: '高',
      due: '2024-12-30',
      owner: '営業部',
    },
  ],

  // 本日の承認待ち
  'approvals.today': [
    {
      project: '渋谷外壁改修',
      type: 'CO起票',
      amount: 850000,
      requestedBy: '佐藤現場監督',
      due: '2024-12-20',
    },
    {
      project: '品川塗装工事',
      type: '追加請求',
      amount: 320000,
      requestedBy: '田中営業',
      due: '2024-12-20',
    },
    {
      project: '池袋リフォーム',
      type: '出来高',
      amount: 1200000,
      requestedBy: '山田現場監督',
      due: '2024-12-21',
    },
  ],

  // チーム負荷
  'team.load': [
    { member: '佐藤太郎', inProgress: 3, overdue: 1, nextSlot: '2024-12-25' },
    { member: '田中花子', inProgress: 4, overdue: 0, nextSlot: '2024-12-22' },
    { member: '山田一郎', inProgress: 2, overdue: 2, nextSlot: '2024-12-28' },
  ],

  // パイプライン
  'sales.pipeline': [
    {
      customer: '鈴木建設',
      stage: 'qualified',
      quoteDue: '2024-12-22',
      amount: 2400000,
    },
    {
      customer: 'ABC不動産',
      stage: 'proposal',
      quoteDue: '2024-12-24',
      amount: 1800000,
    },
    {
      customer: '東京ハウス',
      stage: 'negotiating',
      quoteDue: '2024-12-26',
      amount: 3200000,
    },
    {
      customer: '青山商事',
      stage: 'contract',
      quoteDue: '2024-12-21',
      amount: 950000,
    },
  ],

  // 請求書一覧
  'ar.invoices': [
    {
      invoiceNo: 'INV-2024-1201',
      customer: '田中建設',
      amount: 1850000,
      due: '2024-12-25',
      status: 'unpaid',
    },
    {
      invoiceNo: 'INV-2024-1202',
      customer: 'XYZ不動産',
      amount: 920000,
      due: '2024-12-30',
      status: 'paid',
    },
    {
      invoiceNo: 'INV-2024-1203',
      customer: '山田工務店',
      amount: 2100000,
      due: '2025-01-05',
      status: 'pending',
    },
  ],

  // キャッシュフロー
  'cash.flow': [
    { date: '2024-12-18', in: 2100000, out: 850000, balance: 24800000 },
    { date: '2024-12-19', in: 0, out: 1200000, balance: 23600000 },
    { date: '2024-12-20', in: 1850000, out: 650000, balance: 24800000 },
  ],

  // 督促状況
  'ar.dunning': [
    {
      customer: '田中建設',
      amount: 1850000,
      aging: 35,
      lastAction: '電話督促',
    },
    {
      customer: '佐藤商事',
      amount: 720000,
      aging: 67,
      lastAction: '内容証明発送',
    },
    {
      customer: 'DEF不動産',
      amount: 450000,
      aging: 12,
      lastAction: 'メール督促',
    },
  ],

  // チャネル別効果
  'ads.channels': [
    { channel: 'Google広告', spend: 250000, leads: 47, cpa: 5319, roas: 3.2 },
    { channel: 'Facebook広告', spend: 180000, leads: 28, cpa: 6428, roas: 2.8 },
    { channel: 'Yahoo広告', spend: 120000, leads: 19, cpa: 6315, roas: 2.9 },
  ],

  // 地図分析
  'ads.geo': [
    { area: '渋谷区', leads: 23, cvRate: 3.2 },
    { area: '新宿区', leads: 18, cvRate: 2.8 },
    { area: '品川区', leads: 15, cvRate: 3.1 },
  ],

  // 現場サマリー
  'sites.summary': [
    {
      site: '渋谷外壁改修',
      progress: 75,
      earned: 15200000,
      pending: 850000,
      risk: '天候',
    },
    {
      site: '新宿リフォーム',
      progress: 45,
      earned: 8900000,
      pending: 320000,
      risk: '材料納期',
    },
    {
      site: '品川塗装工事',
      progress: 90,
      earned: 21100000,
      pending: 1200000,
      risk: '検査待ち',
    },
  ],

  // 受付キュー
  'reception.queue': [
    {
      customer: '田中太郎',
      purpose: '外壁塗装相談',
      sla: 15,
      room: 'A室',
      car: '駐車場1',
    },
    {
      customer: '佐藤花子',
      purpose: 'リフォーム見積',
      sla: 8,
      room: 'B室',
      car: '駐車場3',
    },
    {
      customer: '山田一郎',
      purpose: 'アフターケア',
      sla: 22,
      room: 'C室',
      car: '駐車場5',
    },
  ],

  // 重複警告
  'customers.duplicates': [
    {
      name: '田中太郎',
      phone: '03-1234-5678',
      address: '東京都渋谷区',
      score: 92,
    },
    {
      name: '佐藤花子',
      phone: '03-2345-6789',
      address: '東京都新宿区',
      score: 87,
    },
  ],

  // 点検スケジュール
  'after.schedule': [
    {
      date: '2024-12-21',
      customer: '鈴木建設',
      type: '定期点検',
      status: 'scheduled',
    },
    {
      date: '2024-12-22',
      customer: 'ABC不動産',
      type: '保証点検',
      status: 'completed',
    },
    {
      date: '2024-12-23',
      customer: '東京ハウス',
      type: '緊急点検',
      status: 'in_progress',
    },
  ],

  // フォローアップ
  'after.followups': [
    {
      case: '渋谷案件',
      next: '是正工事見積',
      owner: '田中',
      due: '2024-12-25',
    },
    {
      case: '新宿案件',
      next: '顧客満足度調査',
      owner: '佐藤',
      due: '2024-12-27',
    },
    {
      case: '品川案件',
      next: '追加メンテナンス提案',
      owner: '山田',
      due: '2024-12-30',
    },
  ],
};

// KPIデータを取得する関数
export function getKPIValue(formulaKey: string): any {
  const value = KPI_STUB_DATA[formulaKey];
  if (value !== undefined) {
    return value;
  }

  // フォールバック値を返す
  console.warn(`KPI stub data not found for key: ${formulaKey}`);
  return 0;
}

// テーブルデータを取得する関数
export function getTableData(sourceKey: string): any[] {
  const data = TABLE_STUB_DATA[sourceKey];
  if (data) {
    return data;
  }

  // フォールバック空配列を返す
  console.warn(`Table stub data not found for key: ${sourceKey}`);
  return [];
}

// ランダムデータ生成（開発用）
export function generateRandomKPI(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// データ更新シミュレーション（リアルタイムっぽく見せる用）
export function simulateDataUpdate(): void {
  // いくつかのKPI値をランダムに変更
  KPI_STUB_DATA['leads.today'] = generateRandomKPI(8, 18);
  KPI_STUB_DATA['visits.today'] = generateRandomKPI(2, 8);
  KPI_STUB_DATA['inquiries.unrepliedToday'] = generateRandomKPI(0, 6);
  KPI_STUB_DATA['approvals.pending'] = generateRandomKPI(3, 9);
}

// 初回データロード時にランダム要素を追加
if (typeof window !== 'undefined') {
  // ブラウザ環境でのみ実行
  setTimeout(() => {
    simulateDataUpdate();
  }, 1000);
}
